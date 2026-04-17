/**
 * Swagger to Playwright API Client Generator Configuration
 * 
 * Customize this file to specify your Swagger/OpenAPI sources.
 * Run with: npx swagger-to-playwright
 */

import type { AutomationConfig } from 'swagger-to-playwright-api-clients';
import * as path from 'path';

const config: AutomationConfig = {
  // Output directory for generated clients
  outputDir: path.join(__dirname, 'src/clients'),

  // Clean output before generation
  cleanOutput: true,

  // Process sources in parallel
  parallel: false,

  // Whether to copy BaseAPIClient.ts to output directory
  copyBaseClient: true,

  // Whether to copy helper/utility files (TestDataGenerator, ApiAssertions, TypeValidator, ApiStatusCodes)
  copyHelperFunctions: true,

  // BaseAPIClient import path (relative to generated client files)
  // Generated clients are at: outputDir/generatedClients/FolderName/
  // Default: '../../BaseAPIClient' - library will copy BaseAPIClient.ts to outputDir
  // baseClientPath: '../../BaseAPIClient',

  // Logger configuration for the generator process
  logger: {
    // Log level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
    level: 'info',

    // Output directory for log files
    outputDir: './logs',

    // Whether to print logs to console
    console: true,

    // Whether to write logs to file
    file: true,
  },

  // Prettier configuration for formatting generated code
  // - undefined: auto-detect .prettierrc from project root (default)
  // - string: path to custom prettier config file (e.g., './custom.prettierrc')
  // - false: disable formatting
  prettierConfig: undefined,

  // Whether to generate a Playwright fixtures file (api.fixture.ts)
  // that exports a custom `test` object with all generated API clients as fixtures
  // Default: true
  generateFixtures: true,

  // Output directory for the generated fixtures file
  // Default: same as outputDir
  fixturesDir: path.join(__dirname, 'src/fixtures'),

  // Swagger/OpenAPI sources
  sources: [
    // Example: Local file
    // {
    //   type: 'file',
    //   source: './swagger/api.json',
    //   // skip: false, // Optional: skip this source
    // },

    // Example: Directory containing multiple Swagger JSON files
    // {
    //   type: 'file',
    //   source: './swagger',
    // },

    // Example: Remote URL
    {
      type: 'url',
      source: 'https://petstore.swagger.io/v2/swagger.json',
      outputDir: './src/clients', // Optional: custom output directory
    },
  ],
};

export default config;
