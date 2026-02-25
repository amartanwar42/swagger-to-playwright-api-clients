/**
 * swagger-to-playwright-api-clients
 * Generate TypeScript API clients from Swagger/OpenAPI specifications for Playwright testing
 */

// Core generator exports
export {
	SwaggerGenerator,
	generateFromFile,
	generateFromUrl,
	GeneratorOptions,
	GeneratorResult,
} from './utils/swagger/SwaggerGenerator';
export { SwaggerParser } from './utils/swagger/SwaggerParser';
export { TypeGenerator } from './utils/swagger/TypeGenerator';
export { ClientGenerator } from './utils/swagger/ClientGenerator';
export { FileWriter } from './utils/swagger/FileWriter';

// Generator types
export * from './utils/swagger/types';

// Utility exports
export * from './utils/swagger/utils/naming';
export * from './utils/swagger/utils/pathUtils';

// Config types
export {
	AutomationConfig,
	SwaggerSourceConfig,
	defaultConfig,
	DEFAULT_BASE_CLIENT_PATH,
} from './config/types';

// Runner
export { runGenerator, RunResults } from './utils/swagger/run-generator';

// Base client for users to extend
export { BaseAPIClient, RequestOptions, APIResponseResult } from './clients/BaseAPIClient';

// Programmatic API
export { generate, generateFromConfig, loadConfig } from './api';
