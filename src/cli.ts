#!/usr/bin/env node
/**
 * CLI entry point for swagger-to-playwright-api-clients
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateFromConfig, loadConfig, generate } from './api';
import { AutomationConfig } from './config/types';

const DEFAULT_CONFIG_NAMES = [
	'generator-config.ts',
	'generator-config.js',
	'swagger-generator.config.ts',
	'swagger-generator.config.js',
];

async function findConfigFile(): Promise<string | null> {
	const cwd = process.cwd();

	for (const name of DEFAULT_CONFIG_NAMES) {
		const configPath = path.join(cwd, name);
		if (fs.existsSync(configPath)) {
			return configPath;
		}
	}

	return null;
}

function printHelp(): void {
	console.log(`
swagger-to-playwright-api-clients - Generate TypeScript API clients from Swagger/OpenAPI

Usage:
  swagger-to-playwright [command] [options]

Commands:
  generate              Generate API clients from config file (default)
  init                  Create a sample configuration file

Options:
  --config <path>       Path to config file (default: generator-config.ts)
  --file <path>         Generate from a single swagger file
  --url <url>           Generate from a single swagger URL
  --output <dir>        Output directory (default: ./src/clients)
  --name <name>         Service name override
  --help, -h            Show this help message
  --version, -v         Show version

Examples:
  # Generate from config file in project root
  swagger-to-playwright

  # Generate from specific config file
  swagger-to-playwright --config ./my-config.ts

  # Generate from a single file
  swagger-to-playwright --file ./swagger.json --output ./src/clients

  # Generate from URL
  swagger-to-playwright --url https://api.example.com/swagger.json --output ./src/clients

  # Initialize a new config file
  swagger-to-playwright init
`);
}

function printVersion(): void {
	try {
		const packageJsonPath = path.join(__dirname, '..', 'package.json');
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
		console.log(`swagger-to-playwright-api-clients v${packageJson.version}`);
	} catch {
		console.log('swagger-to-playwright-api-clients v1.0.0');
	}
}

async function initConfig(): Promise<void> {
	const configPath = path.join(process.cwd(), 'generator-config.ts');

	if (fs.existsSync(configPath)) {
		console.error('Error: generator-config.ts already exists');
		process.exit(1);
	}

	const configContent = `/**
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

  // BaseAPIClient import path (relative to generated client files)
  // Generated clients are at: outputDir/generatedClients/ServiceName/FolderName/
  // Default: '../../../BaseAPIClient' - library will copy BaseAPIClient.ts to outputDir
  // baseClientPath: '../../../BaseAPIClient',

  // Swagger/OpenAPI sources
  sources: [
    // Example: Local file
    // {
    //   type: 'file',
    //   source: './swagger/api.json',
    //   serviceName: 'MyService',
    // },

    // Example: Remote URL
    // {
    //   type: 'url',
    //   source: 'https://api.example.com/swagger.json',
    //   serviceName: 'ExampleService',
    // },
  ],
};

export default config;
`;

	await fs.promises.writeFile(configPath, configContent, 'utf-8');
	console.log('Created generator-config.ts');
	console.log('\nNext steps:');
	console.log('1. Edit generator-config.ts to add your Swagger sources');
	console.log('2. Run: npx swagger-to-playwright');
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	// Handle help
	if (args.includes('--help') || args.includes('-h')) {
		printHelp();
		return;
	}

	// Handle version
	if (args.includes('--version') || args.includes('-v')) {
		printVersion();
		return;
	}

	// Handle init command
	if (args[0] === 'init') {
		await initConfig();
		return;
	}

	// Handle single file/url mode
	const fileIndex = args.indexOf('--file');
	const urlIndex = args.indexOf('--url');
	const outputIndex = args.indexOf('--output');
	const nameIndex = args.indexOf('--name');

	if (fileIndex !== -1 || urlIndex !== -1) {
		const outputDir = outputIndex !== -1 ? args[outputIndex + 1] : './src/clients';
		const serviceName = nameIndex !== -1 ? args[nameIndex + 1] : undefined;

		const type = fileIndex !== -1 ? 'file' : 'url';
		const source = fileIndex !== -1 ? args[fileIndex + 1] : args[urlIndex + 1];

		if (!source) {
			console.error(`Error: Missing ${type} path`);
			process.exit(1);
		}

		console.log(`Generating from ${type}: ${source}`);

		const result = await generate({
			source,
			type,
			outputDir: path.resolve(outputDir),
			serviceName,
		});

		if (result.success) {
			console.log(`\n✓ Successfully generated ${result.filesWritten.length} files`);
			console.log(`\nFolder Structure:\n${result.folderStructure}`);
		} else {
			console.error(`\n✗ Generation failed: ${result.errors.join(', ')}`);
			process.exit(1);
		}
		return;
	}

	// Handle config-based generation
	const configIndex = args.indexOf('--config');
	let configPath: string | null = null;

	if (configIndex !== -1) {
		configPath = args[configIndex + 1];
		if (!configPath) {
			console.error('Error: Missing config file path');
			process.exit(1);
		}
	} else {
		configPath = await findConfigFile();
	}

	if (!configPath) {
		console.error('Error: No configuration file found.');
		console.error('Create a generator-config.ts file or use --config to specify one.');
		console.error('\nRun "swagger-to-playwright init" to create a sample config file.');
		process.exit(1);
	}

	console.log(`Using config: ${configPath}`);

	try {
		const config = await loadConfig(configPath);
		const results = await generateFromConfig(config);

		console.log('\n' + '='.repeat(60));
		console.log('Generation Complete');
		console.log('='.repeat(60));
		console.log(`Total Sources: ${results.totalSources}`);
		console.log(`Successful: ${results.successful}`);
		console.log(`Failed: ${results.failed}`);
		console.log(`Skipped: ${results.skipped}`);

		if (results.failed > 0) {
			process.exit(1);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
