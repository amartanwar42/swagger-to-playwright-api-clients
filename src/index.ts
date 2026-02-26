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
	LoggerConfig,
	LogLevel,
	defaultConfig,
	defaultLoggerConfig,
	DEFAULT_BASE_CLIENT_PATH,
} from './config/types';

// Logger exports - use these to configure and access the logger
export {
	default as logger,
	getLogger,
	configureLogger,
	getLoggerConfig,
	logRequest,
	logError,
} from './utils/logger';

// Formatter exports - for formatting generated code
export {
	formatCode,
	formatFile,
	formatFiles,
	loadPrettierConfig,
	clearPrettierCache,
} from './utils/formatter';

// Runner
export { runGenerator, RunResults } from './utils/swagger/run-generator';

// Base client for users to extend
export {
	BaseAPIClient,
	RequestOptions,
	APIResponseResult,
	QueryParamValue,
} from './clients/BaseAPIClient';

// Copy utilities for generated output
export { copyBaseClient } from './utils/copyBaseClient';

// Programmatic API
export { generate, generateFromConfig, loadConfig } from './api';
