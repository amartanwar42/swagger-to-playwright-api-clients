/**
 * Configuration types for the generator
 */

/**
 * Log level types
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Logger configuration options
 */
export interface LoggerConfig {
	/**
	 * Log level (can also be set via LOG_LEVEL environment variable)
	 * Environment variable takes precedence if set
	 * Default: 'info'
	 */
	level?: LogLevel;

	/**
	 * Output directory for log files
	 * Default: './logs' (relative to project root)
	 */
	outputDir?: string;

	/**
	 * Whether to print logs to console
	 * Can also be set via LOG_CONSOLE environment variable ('true' or 'false')
	 * Default: true
	 */
	console?: boolean;

	/**
	 * Whether to write logs to file
	 * Default: true
	 */
	file?: boolean;

	/**
	 * Maximum size of each log file in bytes
	 * Default: 5242880 (5MB)
	 */
	maxFileSize?: number;

	/**
	 * Maximum number of log files to keep
	 * Default: 5
	 */
	maxFiles?: number;
}

/**
 * Configuration for a single Swagger source
 */
export interface SwaggerSourceConfig {
	/**
	 * Type of source: 'file' for local JSON file or directory containing JSON files, 'url' for remote URL
	 */
	type: 'file' | 'url';

	/**
	 * Path to local file, directory containing Swagger JSON files, or URL to remote Swagger JSON
	 * For files: can be absolute or relative to project root (single .json file)
	 * For directories: all .json files in the directory will be processed
	 * For URLs: must be a valid HTTP/HTTPS URL
	 */
	source: string;

	/**
	 * Optional: Override the service name (defaults to title from swagger info)
	 */
	serviceName?: string;

	/**
	 * Optional: Custom output directory for this source
	 * If not specified, uses the global outputDir
	 */
	outputDir?: string;

	/**
	 * Optional: Whether to skip this source during generation
	 */
	skip?: boolean;
}

/**
 * Main automation configuration
 */
export interface AutomationConfig {
	/**
	 * Global output directory for generated clients
	 * Relative to project root or absolute path
	 */
	outputDir: string;

	/**
	 * List of Swagger sources to process
	 */
	sources: SwaggerSourceConfig[];

	/**
	 * Optional: Path to BaseAPIClient (relative to generated client files)
	 * Generated clients are at: outputDir/generatedClients/ServiceName/FolderName/
	 * Default: '../../../BaseAPIClient' (points to outputDir/BaseAPIClient.ts)
	 */
	baseClientPath?: string;

	/**
	 * Optional: Whether to copy BaseAPIClient to output directory
	 * Default: true (if baseClientPath is not provided)
	 */
	copyBaseClient?: boolean;

	/**
	 * Optional: Whether to clean output directory before generation
	 */
	cleanOutput?: boolean;

	/**
	 * Optional: Whether to run in parallel (default: false for stability)
	 */
	parallel?: boolean;

	/**
	 * Optional: Logger configuration
	 */
	logger?: LoggerConfig;

	/**
	 * Optional: Path to Prettier config file
	 * If not provided, uses default Prettier config or looks for .prettierrc in project root
	 * Set to false to disable formatting
	 */
	prettierConfig?: string | false;
}

/**
 * Default logger configuration
 */
export const defaultLoggerConfig: LoggerConfig = {
	level: 'info',
	outputDir: './logs',
	console: true,
	file: true,
	maxFileSize: 5242880, // 5MB
	maxFiles: 5,
};

/**
 * Default configuration values
 * Path is relative from: outputDir/generatedClients/ServiceName/FolderName/
 * to: outputDir/BaseAPIClient.ts
 */
export const DEFAULT_BASE_CLIENT_PATH = '../../../BaseAPIClient';

export const defaultConfig: Partial<AutomationConfig> = {
	cleanOutput: true,
	parallel: false,
	copyBaseClient: true,
	baseClientPath: DEFAULT_BASE_CLIENT_PATH,
	logger: defaultLoggerConfig,
	prettierConfig: undefined, // Use default Prettier config
};
