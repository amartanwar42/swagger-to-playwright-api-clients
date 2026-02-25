/**
 * Type definitions for Swagger/OpenAPI parsing
 * Supports Swagger 2.0 and OpenAPI 3.x (including 3.1)
 */

// Common types
export interface SwaggerInfo {
	title: string;
	version: string;
	description?: string;
}

export interface SwaggerParameter {
	name: string;
	in: 'path' | 'query' | 'header' | 'body' | 'formData';
	required?: boolean;
	type?: string;
	format?: string;
	description?: string;
	schema?: SchemaObject;
	items?: SchemaObject;
	enum?: string[];
}

export interface SchemaObject {
	type?: string;
	format?: string;
	$ref?: string;
	items?: SchemaObject;
	properties?: Record<string, SchemaObject>;
	required?: string[];
	additionalProperties?: boolean | SchemaObject;
	enum?: (string | number)[];
	nullable?: boolean;
	allOf?: SchemaObject[];
	oneOf?: SchemaObject[];
	anyOf?: SchemaObject[];
	description?: string;
	default?: unknown;
	example?: unknown;
}

export interface RequestBody {
	required?: boolean;
	content: Record<
		string,
		{
			schema?: SchemaObject;
		}
	>;
}

export interface ResponseObject {
	description?: string;
	schema?: SchemaObject; // Swagger 2.0
	content?: Record<
		string,
		{
			schema?: SchemaObject;
		}
	>; // OpenAPI 3.x
}

export interface OperationObject {
	operationId?: string;
	summary?: string;
	description?: string;
	tags?: string[];
	parameters?: SwaggerParameter[];
	requestBody?: RequestBody; // OpenAPI 3.x
	responses?: Record<string, ResponseObject>;
	deprecated?: boolean;
}

export interface PathItemObject {
	get?: OperationObject;
	post?: OperationObject;
	put?: OperationObject;
	patch?: OperationObject;
	delete?: OperationObject;
	parameters?: SwaggerParameter[];
}

// Swagger 2.0 specific
export interface Swagger2Document {
	swagger: '2.0';
	info: SwaggerInfo;
	host?: string;
	basePath?: string;
	schemes?: string[];
	paths: Record<string, PathItemObject>;
	definitions?: Record<string, SchemaObject>;
	parameters?: Record<string, SwaggerParameter>;
}

// OpenAPI 3.x specific
export interface OpenAPI3Document {
	openapi: string; // "3.0.x" or "3.1.x"
	info: SwaggerInfo;
	servers?: Array<{ url: string; description?: string }>;
	paths: Record<string, PathItemObject>;
	components?: {
		schemas?: Record<string, SchemaObject>;
		parameters?: Record<string, SwaggerParameter>;
		requestBodies?: Record<string, RequestBody>;
		responses?: Record<string, ResponseObject>;
	};
}

export type SwaggerDocument = Swagger2Document | OpenAPI3Document;

// Parsed endpoint representation
export interface ParsedEndpoint {
	path: string;
	method: string;
	operationId?: string;
	summary?: string;
	description?: string;
	tags?: string[];
	pathParams: ParsedParameter[];
	queryParams: ParsedParameter[];
	headerParams: ParsedParameter[];
	requestBody?: ParsedSchema;
	responses: Record<string, ParsedSchema>;
	deprecated?: boolean;
}

export interface ParsedParameter {
	name: string;
	required: boolean;
	type: string;
	description?: string;
	enum?: (string | number)[];
}

export interface ParsedSchema {
	typeName: string;
	typeDefinition: string;
	isArray?: boolean;
	isEnum?: boolean;
	enumValues?: (string | number)[];
	properties?: Record<string, ParsedSchema>;
	required?: string[];
}

// Generator output types
export interface GeneratedType {
	name: string;
	definition: string;
	source: string; // Original schema path for deduplication
}

export interface GeneratedClient {
	serviceName: string;
	folder: string[];
	imports: string[];
	functions: string[];
	types: GeneratedType[];
}

export interface GeneratorOutput {
	serviceName: string;
	clients: GeneratedClient[];
	sharedTypes: GeneratedType[];
}
