/**
 * Programmatic API for the generator
 * Allows users to use the generator as a library
 */

import * as fs from 'fs';
import * as path from 'path';
import { AutomationConfig, defaultConfig, DEFAULT_BASE_CLIENT_PATH } from './config/types';
import { runGenerator, RunResults } from './utils/swagger/run-generator';
import { SwaggerGenerator, GeneratorResult } from './utils/swagger/SwaggerGenerator';
import { copyBaseClient } from './utils/copyBaseClient';
import logger from './utils/logger';

/**
 * Generate API clients from a single swagger source
 */
export async function generate(options: {
	source: string;
	type: 'file' | 'url';
	outputDir: string;
	serviceName?: string;
	baseClientPath?: string;
	copyBaseClient?: boolean;
}): Promise<GeneratorResult> {
	const {
		source,
		type,
		outputDir,
		serviceName,
		baseClientPath,
		copyBaseClient: shouldCopyBaseClient = true,
	} = options;

	// Copy BaseAPIClient if needed
	if (shouldCopyBaseClient && !baseClientPath) {
		await copyBaseClient(outputDir);
	}

	const generatedClientsDir = path.join(outputDir, 'generatedClients');
	await fs.promises.mkdir(generatedClientsDir, { recursive: true });

	const generator = new SwaggerGenerator({
		outputDir: generatedClientsDir,
		serviceName,
		baseClientPath: baseClientPath || DEFAULT_BASE_CLIENT_PATH,
	});

	if (type === 'file') {
		const filePath = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
		return generator.generateFromFile(filePath);
	} else {
		return generator.generateFromUrl(source);
	}
}

/**
 * Generate API clients from a configuration object
 */
export async function generateFromConfig(config: AutomationConfig): Promise<RunResults> {
	const mergedConfig: AutomationConfig = {
		...defaultConfig,
		...config,
	};

	// Copy BaseAPIClient if needed (when no custom baseClientPath is provided)
	if (mergedConfig.copyBaseClient !== false && !config.baseClientPath) {
		await copyBaseClient(mergedConfig.outputDir);
		// Use the default base client path relative to generated clients
		mergedConfig.baseClientPath = DEFAULT_BASE_CLIENT_PATH;
	}

	return runGenerator(mergedConfig);
}

/**
 * Load configuration from a file path
 */
export async function loadConfig(configPath: string): Promise<AutomationConfig> {
	const absolutePath = path.isAbsolute(configPath)
		? configPath
		: path.join(process.cwd(), configPath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(`Configuration file not found: ${absolutePath}`);
	}

	// For TypeScript files, we need to use dynamic import or require with ts-node
	const ext = path.extname(absolutePath);

	if (ext === '.ts') {
		// Try to load TypeScript config
		try {
			// Check if ts-node is available
			require.resolve('ts-node');
			require('ts-node').register({
				transpileOnly: true,
				compilerOptions: {
					module: 'commonjs',
				},
			});
		} catch {
			// ts-node not available, try to load compiled JS version
			const jsPath = absolutePath.replace(/\.ts$/, '.js');
			if (fs.existsSync(jsPath)) {
				const config = require(jsPath);
				return config.default || config;
			}
			throw new Error(
				'ts-node is not installed. Install it with: npm install -D ts-node\n' +
					'Or compile your config to JavaScript first.'
			);
		}
	}

	const config = require(absolutePath);
	return config.default || config;
}
