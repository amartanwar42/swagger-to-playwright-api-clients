/**
 * Automation Configuration for Swagger to Playwright API Client Generation
 *
 * This configuration file allows you to specify swagger sources (files or URLs)
 * and customize the generation output.
 *
 * Usage:
 *   1. Configure your swagger sources below
 *   2. Run: npx swagger-to-playwright
 *   OR
 *   2. Run: npm run generate
 */

import * as path from 'path';
import type { AutomationConfig, SwaggerSourceConfig } from './src/config/types';

// Re-export types for external use
export type { AutomationConfig, SwaggerSourceConfig };

/**
 * ============================================
 * CONFIGURE YOUR SWAGGER SOURCES BELOW
 * ============================================
 */

const config: AutomationConfig = {
	// Output directory for all generated API clients
	outputDir: path.join(__dirname, 'src/clients/'),

	// Relative import path from generated client files to BaseAPIClient
	// Generated clients are at: outputDir/generatedClients/ServiceName/FolderName/
	// Default: '../../../BaseAPIClient' (library will auto-copy BaseAPIClient.ts to outputDir)
	// If you have a custom BaseAPIClient, specify the path here:
	// baseClientPath: '../../../BaseAPIClient',

	// Clean the output directory before generating (optional)
	cleanOutput: true,

	// Process sources in parallel (optional, default: false)
	parallel: false,

	// List of Swagger/OpenAPI sources
	sources: [
		// =====================================
		// EXAMPLE: Local JSON file
		// =====================================
		// {
		//   type: 'file',
		//   source: './swagger/petstore.json',
		//   serviceName: 'PetStoreService',
		// },
		// =====================================
		// EXAMPLE: Directory with multiple JSON files
		// =====================================
		// {
		//   type: 'file',
		//   source: './swagger/', // Directory containing swagger JSON files
		//   // serviceName is optional - uses filename as service name if not provided
		// },
		// =====================================
		// EXAMPLE: Remote URL
		// =====================================
		// {
		//   type: 'url',
		//   source: 'https://petstore.swagger.io/v2/swagger.json',
		//   serviceName: 'PetStoreService',
		// },
		// =====================================
		// EXAMPLE: Multiple services
		// =====================================
		// {
		//   type: 'url',
		//   source: 'https://api.example.com/v1/swagger.json',
		//   serviceName: 'ActivityService',
		// },
		// {
		//   type: 'file',
		//   source: './swagger/users-api.json',
		//   serviceName: 'UserService',
		// },
		// {
		//   type: 'url',
		//   source: 'https://api.example.com/v2/openapi.json',
		//   serviceName: 'PaymentService',
		//   skip: true, // Skip this source temporarily
		// },
		// =====================================
		// ADD YOUR SOURCES HERE
		// =====================================
	],
};

export default config;
