/**
 * ClientGenerator - Generates API client functions from parsed endpoints
 * Uses BaseAPIClient for all HTTP requests
 */

import { ParsedEndpoint } from './types';
import { TypeGenerator } from './TypeGenerator';
import {
	generateFunctionName,
	extractResourceName,
	extractPathParams,
	toCamelCase,
} from './utils/naming';
import { generatePathTemplate } from './utils/pathUtils';

export interface GeneratedFunction {
	name: string;
	code: string;
	endpoint: ParsedEndpoint;
}

export class ClientGenerator {
	private typeGenerator: TypeGenerator;
	private baseClientPath: string;

	constructor(typeGenerator: TypeGenerator, baseClientPath?: string) {
		this.typeGenerator = typeGenerator;
		this.baseClientPath = baseClientPath || '../../clients/BaseAPIClient';
	}

	/**
	 * Generate client function for an endpoint
	 */
	generateClientFunction(endpoint: ParsedEndpoint): GeneratedFunction {
		const resourceName = extractResourceName(endpoint.path);
		const pathParams = extractPathParams(endpoint.path);
		const functionName = generateFunctionName(endpoint.method, resourceName, pathParams);

		const code = this.buildFunctionCode(endpoint, functionName);

		return {
			name: functionName,
			code,
			endpoint,
		};
	}

	/**
	 * Generate all client functions for a group of endpoints
	 */
	generateClientFunctions(endpoints: ParsedEndpoint[]): GeneratedFunction[] {
		return endpoints.map((endpoint) => this.generateClientFunction(endpoint));
	}

	/**
	 * Build the function code
	 */
	private buildFunctionCode(endpoint: ParsedEndpoint, functionName: string): string {
		const pathParams = extractPathParams(endpoint.path);
		const pathTemplate = generatePathTemplate(endpoint.path);
		const method = endpoint.method.toLowerCase();

		// Build function parameters
		const params = this.buildFunctionParams(endpoint, pathParams);

		// Build function body
		const body = this.buildFunctionBody(endpoint, method, pathTemplate);

		// Get type annotations
		const requestTypeName = this.typeGenerator.getRequestTypeName(endpoint);
		const responseTypeName = this.typeGenerator.getResponseTypeName(endpoint) || 'unknown';

		// Build JSDoc comment
		const jsDoc = this.buildJsDoc(endpoint);

		// Build the complete function
		return `${jsDoc}
${functionName} = async (${params}): Promise<APIResponseResult<${responseTypeName}>> => {
  ${body}
}`;
	}

	/**
	 * Build function parameters
	 */
	private buildFunctionParams(endpoint: ParsedEndpoint, pathParams: string[]): string {
		const params: string[] = [];

		// Add path parameters
		for (const param of pathParams) {
			const paramDef = endpoint.pathParams.find((p) => p.name === param);
			const type = paramDef?.type || 'string';
			params.push(`${toCamelCase(param)}: ${type}`);
		}

		// Determine if we need a data/payload parameter
		const hasRequestBody = !!endpoint.requestBody;
		const hasQueryParams = endpoint.queryParams.length > 0;
		const method = endpoint.method.toLowerCase();

		if (hasRequestBody && ['post', 'put', 'patch', 'delete'].includes(method)) {
			const requestTypeName = this.typeGenerator.getRequestTypeName(endpoint);
			if (requestTypeName) {
				params.push(`data: ${requestTypeName}`);
			} else {
				params.push('data: unknown');
			}
		}

		// Add query params as options if they exist
		if (hasQueryParams) {
			const queryType = this.buildQueryParamsType(endpoint);
			const optional = endpoint.queryParams.every((p) => !p.required);
			params.push(`params${optional ? '?' : ''}: ${queryType}`);
		}

		// Add optional request options
		params.push('options?: RequestOptions');

		return params.join(', ');
	}

	/**
	 * Build query params type
	 */
	private buildQueryParamsType(endpoint: ParsedEndpoint): string {
		const props = endpoint.queryParams.map((param) => {
			const optional = param.required ? '' : '?';
			return `${param.name}${optional}: ${param.type}`;
		});

		return `{ ${props.join('; ')} }`;
	}

	/**
	 * Build function body
	 */
	private buildFunctionBody(
		endpoint: ParsedEndpoint,
		method: string,
		pathTemplate: string
	): string {
		const hasQueryParams = endpoint.queryParams.length > 0;
		const hasRequestBody = !!endpoint.requestBody;

		const lines: string[] = [];

		// Build request options
		if (hasQueryParams) {
			lines.push('const reqOptions = { ...options, params };');
		}

		// Build the request call
		const optionsArg = hasQueryParams ? 'reqOptions' : 'options';

		if (['post', 'put', 'patch'].includes(method)) {
			if (hasRequestBody) {
				lines.push(`return this.client.${method}(${pathTemplate}, data, ${optionsArg});`);
			} else {
				lines.push(`return this.client.${method}(${pathTemplate}, {}, ${optionsArg});`);
			}
		} else if (method === 'delete') {
			if (hasRequestBody) {
				lines.push(`return this.client.delete(${pathTemplate}, data, ${optionsArg});`);
			} else {
				lines.push(`return this.client.delete(${pathTemplate}, undefined, ${optionsArg});`);
			}
		} else {
			// GET
			lines.push(`return this.client.${method}(${pathTemplate}, ${optionsArg});`);
		}

		return lines.join('\n  ');
	}

	/**
	 * Build JSDoc comment
	 */
	private buildJsDoc(endpoint: ParsedEndpoint): string {
		const lines: string[] = ['/**'];

		if (endpoint.summary) {
			lines.push(` * ${endpoint.summary}`);
		}

		if (endpoint.description) {
			lines.push(` * ${endpoint.description}`);
		}

		if (endpoint.deprecated) {
			lines.push(' * @deprecated');
		}

		// Add param docs
		for (const param of endpoint.pathParams) {
			lines.push(` * @param ${param.name} - ${param.description || 'Path parameter'}`);
		}

		if (endpoint.requestBody) {
			lines.push(' * @param data - Request body');
		}

		if (endpoint.queryParams.length > 0) {
			lines.push(' * @param params - Query parameters');
		}

		lines.push(' */');

		return lines.join('\n');
	}

	/**
	 * Generate a complete client class for a group of endpoints
	 */
	generateClientClass(
		className: string,
		endpoints: ParsedEndpoint[],
		typeImports: string[]
	): string {
		const functions = this.generateClientFunctions(endpoints);

		const functionCode = functions.map((f) => `  ${f.code}`).join('\n\n');

		return `import { BaseAPIClient, RequestOptions, APIResponseResult } from '${this.baseClientPath}';
${typeImports.length > 0 ? `import { ${typeImports.join(', ')} } from './types';` : ''}

/**
 * ${className} - Auto-generated API client
 */
export class ${className} {
  private client: BaseAPIClient;

  constructor(client: BaseAPIClient) {
    this.client = client;
  }

${functionCode}
}

export default ${className};
`;
	}
}
