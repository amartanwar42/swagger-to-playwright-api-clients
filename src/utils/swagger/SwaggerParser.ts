/**
 * SwaggerParser - Parses Swagger 2.0 and OpenAPI 3.x documents
 * Extracts endpoints, schemas, and parameters into a unified format
 */

import {
	SwaggerDocument,
	Swagger2Document,
	OpenAPI3Document,
	ParsedEndpoint,
	ParsedParameter,
	ParsedSchema,
	SchemaObject,
	OperationObject,
	SwaggerParameter,
} from './types';
import { toPascalCase } from './utils/naming';

export class SwaggerParser {
	private document: SwaggerDocument;
	private schemas: Map<string, SchemaObject> = new Map();
	private generatedTypes: Map<string, string> = new Map();

	constructor(document: SwaggerDocument) {
		this.document = document;
		this.loadSchemas();
	}

	/**
	 * Detect if document is Swagger 2.0 or OpenAPI 3.x
	 */
	isSwagger2(): boolean {
		return 'swagger' in this.document && this.document.swagger === '2.0';
	}

	isOpenAPI3(): boolean {
		return 'openapi' in this.document && this.document.openapi.startsWith('3.');
	}

	/**
	 * Get service name from document info
	 */
	getServiceName(): string {
		const title = this.document.info.title || 'ApiService';
		return toPascalCase(title.replace(/api|service/gi, '').trim()) + 'Service';
	}

	/**
	 * Load all schemas from the document
	 */
	private loadSchemas(): void {
		if (this.isSwagger2()) {
			const doc = this.document as Swagger2Document;
			if (doc.definitions) {
				for (const [name, schema] of Object.entries(doc.definitions)) {
					this.schemas.set(`#/definitions/${name}`, schema);
					this.schemas.set(name, schema);
				}
			}
		} else if (this.isOpenAPI3()) {
			const doc = this.document as OpenAPI3Document;
			if (doc.components?.schemas) {
				for (const [name, schema] of Object.entries(doc.components.schemas)) {
					this.schemas.set(`#/components/schemas/${name}`, schema);
					this.schemas.set(name, schema);
				}
			}
		}
	}

	/**
	 * Resolve a $ref to its schema
	 */
	resolveRef(ref: string): SchemaObject | undefined {
		return this.schemas.get(ref);
	}

	/**
	 * Extract ref name from $ref path
	 */
	private extractRefName(ref: string): string {
		const parts = ref.split('/');
		return parts[parts.length - 1];
	}

	/**
	 * Parse all endpoints from the document
	 */
	parseEndpoints(): ParsedEndpoint[] {
		const endpoints: ParsedEndpoint[] = [];
		const paths = this.document.paths;

		for (const [path, pathItem] of Object.entries(paths)) {
			const methods: Array<'get' | 'post' | 'put' | 'patch' | 'delete'> = [
				'get',
				'post',
				'put',
				'patch',
				'delete',
			];

			// Get path-level parameters
			const pathLevelParams = pathItem.parameters || [];

			for (const method of methods) {
				const operation = pathItem[method];
				if (!operation) continue;

				const endpoint = this.parseOperation(
					path,
					method.toUpperCase(),
					operation,
					pathLevelParams
				);
				endpoints.push(endpoint);
			}
		}

		return endpoints;
	}

	/**
	 * Parse a single operation
	 */
	private parseOperation(
		path: string,
		method: string,
		operation: OperationObject,
		pathLevelParams: SwaggerParameter[]
	): ParsedEndpoint {
		// Combine path-level and operation-level parameters
		const allParams = [...pathLevelParams, ...(operation.parameters || [])];

		const pathParams = this.parseParameters(allParams.filter((p) => p.in === 'path'));
		const queryParams = this.parseParameters(allParams.filter((p) => p.in === 'query'));
		const headerParams = this.parseParameters(allParams.filter((p) => p.in === 'header'));

		// Parse request body (different for Swagger 2.0 vs OpenAPI 3.x)
		let requestBody: ParsedSchema | undefined;
		if (this.isSwagger2()) {
			const bodyParam = allParams.find((p) => p.in === 'body');
			if (bodyParam?.schema) {
				requestBody = this.parseSchema(bodyParam.schema, 'RequestBody');
			}
		} else if (operation.requestBody) {
			const content = operation.requestBody.content;
			const schema = content['application/json']?.schema || Object.values(content)[0]?.schema;
			if (schema) {
				requestBody = this.parseSchema(schema, 'RequestBody');
			}
		}

		// Parse responses
		const responses: Record<string, ParsedSchema> = {};
		if (operation.responses) {
			for (const [statusCode, response] of Object.entries(operation.responses)) {
				let schema: SchemaObject | undefined;

				if (this.isSwagger2() && response.schema) {
					schema = response.schema;
				} else if (response.content) {
					schema =
						response.content['application/json']?.schema ||
						Object.values(response.content)[0]?.schema;
				}

				if (schema) {
					responses[statusCode] = this.parseSchema(schema, `Response${statusCode}`);
				}
			}
		}

		return {
			path,
			method,
			operationId: operation.operationId,
			summary: operation.summary,
			description: operation.description,
			tags: operation.tags,
			pathParams,
			queryParams,
			headerParams,
			requestBody,
			responses,
			deprecated: operation.deprecated,
		};
	}

	/**
	 * Parse parameters array
	 */
	private parseParameters(params: SwaggerParameter[]): ParsedParameter[] {
		return params.map((param) => ({
			name: param.name,
			required: param.required || false,
			type: this.parameterToTypeScript(param),
			description: param.description,
			enum: param.enum,
		}));
	}

	/**
	 * Convert parameter to TypeScript type
	 */
	private parameterToTypeScript(param: SwaggerParameter): string {
		if (param.schema) {
			return this.schemaToTypeScript(param.schema);
		}

		const typeMap: Record<string, string> = {
			string: 'string',
			integer: 'number',
			number: 'number',
			boolean: 'boolean',
			array: 'unknown[]',
			object: 'Record<string, unknown>',
			file: 'File',
		};

		if (param.enum) {
			return param.enum.map((e) => `'${e}'`).join(' | ');
		}

		return typeMap[param.type || 'string'] || 'unknown';
	}

	/**
	 * Parse schema into TypeScript representation
	 */
	parseSchema(schema: SchemaObject, defaultName: string): ParsedSchema {
		// Handle $ref
		if (schema.$ref) {
			const refName = this.extractRefName(schema.$ref);
			const resolvedSchema = this.resolveRef(schema.$ref);
			if (resolvedSchema) {
				return {
					typeName: toPascalCase(refName),
					typeDefinition: this.schemaToTypeScript(resolvedSchema),
				};
			}
			return {
				typeName: toPascalCase(refName),
				typeDefinition: toPascalCase(refName),
			};
		}

		// Handle array
		if (schema.type === 'array' && schema.items) {
			const itemsSchema = this.parseSchema(schema.items, `${defaultName}Item`);
			return {
				typeName: `${itemsSchema.typeName}[]`,
				typeDefinition: `${itemsSchema.typeDefinition}[]`,
				isArray: true,
			};
		}

		// Handle enum
		if (schema.enum) {
			return {
				typeName: defaultName,
				typeDefinition: schema.enum.map((e) => (typeof e === 'string' ? `'${e}'` : e)).join(' | '),
				isEnum: true,
				enumValues: schema.enum,
			};
		}

		// Handle allOf, oneOf, anyOf
		if (schema.allOf) {
			const types = schema.allOf.map((s, i) => this.parseSchema(s, `${defaultName}AllOf${i}`));
			return {
				typeName: defaultName,
				typeDefinition: types.map((t) => t.typeDefinition).join(' & '),
			};
		}

		if (schema.oneOf || schema.anyOf) {
			const schemas = schema.oneOf || schema.anyOf || [];
			const types = schemas.map((s, i) => this.parseSchema(s, `${defaultName}Union${i}`));
			return {
				typeName: defaultName,
				typeDefinition: types.map((t) => t.typeDefinition).join(' | '),
			};
		}

		// Handle object
		if (schema.type === 'object' || schema.properties) {
			return {
				typeName: defaultName,
				typeDefinition: this.objectSchemaToTypeScript(schema),
				properties: schema.properties
					? Object.fromEntries(
							Object.entries(schema.properties).map(([key, value]) => [
								key,
								this.parseSchema(value, key),
							])
						)
					: undefined,
				required: schema.required,
			};
		}

		// Handle primitive types
		return {
			typeName: defaultName,
			typeDefinition: this.schemaToTypeScript(schema),
		};
	}

	/**
	 * Convert schema to TypeScript type string
	 */
	schemaToTypeScript(schema: SchemaObject): string {
		// Handle $ref
		if (schema.$ref) {
			return toPascalCase(this.extractRefName(schema.$ref));
		}

		// Handle array
		if (schema.type === 'array' && schema.items) {
			return `${this.schemaToTypeScript(schema.items)}[]`;
		}

		// Handle enum
		if (schema.enum) {
			return schema.enum.map((e) => (typeof e === 'string' ? `'${e}'` : e)).join(' | ');
		}

		// Handle allOf
		if (schema.allOf) {
			return schema.allOf.map((s) => this.schemaToTypeScript(s)).join(' & ');
		}

		// Handle oneOf/anyOf
		if (schema.oneOf || schema.anyOf) {
			const schemas = schema.oneOf || schema.anyOf || [];
			return schemas.map((s) => this.schemaToTypeScript(s)).join(' | ');
		}

		// Handle object with properties
		if (schema.type === 'object' || schema.properties) {
			return this.objectSchemaToTypeScript(schema);
		}

		// Handle additional properties (dictionary)
		if (schema.additionalProperties) {
			if (typeof schema.additionalProperties === 'boolean') {
				return 'Record<string, unknown>';
			}
			return `Record<string, ${this.schemaToTypeScript(schema.additionalProperties)}>`;
		}

		// Handle primitive types
		const typeMap: Record<string, string> = {
			string: 'string',
			integer: 'number',
			number: 'number',
			boolean: 'boolean',
			null: 'null',
			file: 'File',
		};

		const baseType = typeMap[schema.type || 'unknown'] || 'unknown';

		// Handle nullable
		if (schema.nullable) {
			return `${baseType} | null`;
		}

		return baseType;
	}

	/**
	 * Convert object schema to TypeScript interface body
	 */
	private objectSchemaToTypeScript(schema: SchemaObject): string {
		if (!schema.properties) {
			if (schema.additionalProperties) {
				if (typeof schema.additionalProperties === 'boolean') {
					return 'Record<string, unknown>';
				}
				return `Record<string, ${this.schemaToTypeScript(schema.additionalProperties)}>`;
			}
			return 'Record<string, unknown>';
		}

		const required = new Set(schema.required || []);
		const props: string[] = [];

		for (const [propName, propSchema] of Object.entries(schema.properties)) {
			const isRequired = required.has(propName);
			const nullable = propSchema.nullable ? ' | null' : '';
			const type = this.schemaToTypeScript(propSchema);
			const safeName = /[^a-zA-Z0-9_$]/.test(propName) ? `'${propName}'` : propName;
			props.push(`${safeName}${isRequired ? '' : '?'}: ${type}${nullable}`);
		}

		return `{\n  ${props.join(';\n  ')}\n}`;
	}

	/**
	 * Get all schemas for type generation
	 */
	getAllSchemas(): Map<string, SchemaObject> {
		return this.schemas;
	}

	/**
	 * Get base URL from document
	 */
	getBaseUrl(): string {
		if (this.isSwagger2()) {
			const doc = this.document as Swagger2Document;
			const scheme = doc.schemes?.[0] || 'https';
			const host = doc.host || 'api.example.com';
			const basePath = doc.basePath || '';
			return `${scheme}://${host}${basePath}`;
		} else {
			const doc = this.document as OpenAPI3Document;
			return doc.servers?.[0]?.url || 'https://api.example.com';
		}
	}
}
