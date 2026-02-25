/**
 * TypeGenerator - Generates TypeScript interfaces from parsed endpoints
 * Handles deduplication and proper naming conventions
 */

import { SwaggerParser } from './SwaggerParser';
import { ParsedEndpoint, GeneratedType, SchemaObject } from './types';
import {
	generateTypeName,
	extractResourceName,
	extractPathParams,
	toPascalCase,
} from './utils/naming';

export class TypeGenerator {
	private parser: SwaggerParser;
	private generatedTypes: Map<string, GeneratedType> = new Map();
	private typeDefinitions: Map<string, string> = new Map();

	constructor(parser: SwaggerParser) {
		this.parser = parser;
	}

	/**
	 * Generate all types from endpoints
	 */
	generateAllTypes(endpoints: ParsedEndpoint[]): GeneratedType[] {
		// First, generate shared schema types
		this.generateSchemaTypes();

		// Then generate endpoint-specific types
		for (const endpoint of endpoints) {
			this.generateEndpointTypes(endpoint);
		}

		return Array.from(this.generatedTypes.values());
	}

	/**
	 * Generate types from top-level schemas
	 */
	private generateSchemaTypes(): void {
		const schemas = this.parser.getAllSchemas();

		for (const [name, schema] of schemas) {
			// Skip refs, only process actual schema definitions
			if (name.startsWith('#/')) continue;

			const typeName = toPascalCase(name);
			if (this.typeDefinitions.has(typeName)) continue;

			const typeBody = this.generateTypeBody(schema);
			this.addType(typeName, typeBody, `schema:${name}`);
		}
	}

	/**
	 * Generate types for a specific endpoint
	 */
	private generateEndpointTypes(endpoint: ParsedEndpoint): void {
		const resourceName = extractResourceName(endpoint.path);
		const pathParams = extractPathParams(endpoint.path);

		// Generate request type only if there's a request body
		if (endpoint.requestBody) {
			const requestTypeName = generateTypeName(
				endpoint.method,
				resourceName,
				pathParams,
				'Request'
			);

			if (!this.typeDefinitions.has(requestTypeName)) {
				const requestBody = this.buildRequestType(endpoint);
				if (requestBody) {
					this.addType(
						requestTypeName,
						requestBody,
						`endpoint:${endpoint.method}:${endpoint.path}:request`
					);
				}
			}
		}

		// Generate response type (use the success response, typically 200 or 201)
		const successCodes = ['200', '201', '202', '204'];
		const responseTypeName = generateTypeName(
			endpoint.method,
			resourceName,
			pathParams,
			'Response'
		);

		if (!this.typeDefinitions.has(responseTypeName)) {
			let responseBody: string | undefined;

			for (const code of successCodes) {
				if (endpoint.responses[code]?.typeDefinition) {
					responseBody = endpoint.responses[code].typeDefinition;
					break;
				}
			}

			// Default to 'any' if no response schema defined or empty object
			const trimmed = responseBody?.replace(/\s/g, '') || '';
			const finalResponseBody = responseBody && trimmed !== '{}' ? responseBody : 'any';
			this.addType(
				responseTypeName,
				finalResponseBody,
				`endpoint:${endpoint.method}:${endpoint.path}:response`
			);
		}
	}

	/**
	 * Build request type from endpoint
	 */
	private buildRequestType(endpoint: ParsedEndpoint): string | null {
		// Only generate type for request body
		if (endpoint.requestBody) {
			return endpoint.requestBody.typeDefinition;
		}

		return null;
	}

	/**
	 * Generate type body from schema
	 */
	private generateTypeBody(schema: SchemaObject): string {
		return this.parser.schemaToTypeScript(schema);
	}

	/**
	 * Add a type with deduplication
	 */
	private addType(name: string, definition: string, source: string): void {
		// Check if we already have this exact definition
		const existingDef = this.typeDefinitions.get(name);
		if (existingDef === definition) return;

		// If name exists with different definition, make it unique
		let uniqueName = name;
		let counter = 1;
		while (
			this.typeDefinitions.has(uniqueName) &&
			this.typeDefinitions.get(uniqueName) !== definition
		) {
			uniqueName = `${name}${counter}`;
			counter++;
		}

		this.typeDefinitions.set(uniqueName, definition);
		this.generatedTypes.set(uniqueName, {
			name: uniqueName,
			definition,
			source,
		});
	}

	/**
	 * Generate TypeScript type declarations as string
	 */
	generateTypeDeclarations(): string {
		const types: string[] = [];

		for (const [name, definition] of this.typeDefinitions) {
			// Check if it's a union type (contains | at top level between objects)
			const isUnionType = this.isUnionTypeDefinition(definition);

			// Check if it's an interface (object type) or type alias
			if (
				definition.startsWith('{') ||
				definition.includes('Record<') ||
				definition.includes('[]')
			) {
				// Union types must use 'type', not 'interface'
				if (definition.startsWith('{') && !isUnionType) {
					types.push(`export interface ${name} ${definition}`);
				} else {
					types.push(`export type ${name} = ${definition};`);
				}
			} else {
				types.push(`export type ${name} = ${definition};`);
			}
		}

		return types.join('\n\n');
	}

	/**
	 * Check if a type definition is a union type (e.g., {...} | {...})
	 */
	private isUnionTypeDefinition(definition: string): boolean {
		// Track brace depth to find top-level | operators
		let braceDepth = 0;
		let parenDepth = 0;
		let bracketDepth = 0;

		for (let i = 0; i < definition.length; i++) {
			const char = definition[i];

			if (char === '{') braceDepth++;
			else if (char === '}') braceDepth--;
			else if (char === '(') parenDepth++;
			else if (char === ')') parenDepth--;
			else if (char === '[') bracketDepth++;
			else if (char === ']') bracketDepth--;
			else if (char === '|' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get type name for an endpoint's request
	 */
	getRequestTypeName(endpoint: ParsedEndpoint): string | null {
		if (!endpoint.requestBody) {
			return null;
		}

		const resourceName = extractResourceName(endpoint.path);
		const pathParams = extractPathParams(endpoint.path);
		return generateTypeName(endpoint.method, resourceName, pathParams, 'Request');
	}

	/**
	 * Get type name for an endpoint's response
	 */
	getResponseTypeName(endpoint: ParsedEndpoint): string | null {
		const successCodes = ['200', '201', '202', '204'];
		for (const code of successCodes) {
			if (endpoint.responses[code]) {
				const resourceName = extractResourceName(endpoint.path);
				const pathParams = extractPathParams(endpoint.path);
				return generateTypeName(endpoint.method, resourceName, pathParams, 'Response');
			}
		}
		return null;
	}
}
