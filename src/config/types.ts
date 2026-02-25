/**
 * Configuration types for the generator
 */

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
}

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
};
