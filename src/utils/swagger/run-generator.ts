/**
 * Generator Runner - Executes swagger generation based on automation config
 */

import * as fs from 'fs';
import * as path from 'path';
import { SwaggerGenerator, GeneratorResult } from '.';
import {
	AutomationConfig,
	SwaggerSourceConfig,
	DEFAULT_BASE_CLIENT_PATH,
} from '../../config/types';
import logger from '../logger';

/**
 * Results for all processed sources
 */
export interface RunResults {
	totalSources: number;
	successful: number;
	failed: number;
	skipped: number;
	results: Array<{
		source: string;
		result: GeneratorResult;
	}>;
}

/**
 * Process a single swagger source
 */
async function processSource(
	sourceConfig: SwaggerSourceConfig,
	globalOutputDir: string,
	baseClientPath?: string
): Promise<GeneratorResult> {
	const outputDir = sourceConfig.outputDir || globalOutputDir;
	const generator = new SwaggerGenerator({
		outputDir,
		serviceName: sourceConfig.serviceName,
		baseClientPath: baseClientPath || DEFAULT_BASE_CLIENT_PATH,
	});

	if (sourceConfig.type === 'file') {
		// Resolve file path relative to project root
		const filePath = path.isAbsolute(sourceConfig.source)
			? sourceConfig.source
			: path.join(process.cwd(), sourceConfig.source);

		return generator.generateFromFile(filePath);
	} else {
		return generator.generateFromUrl(sourceConfig.source);
	}
}

/**
 * Clean output directory
 */
async function cleanDirectory(dirPath: string): Promise<void> {
	try {
		await fs.promises.rm(dirPath, { recursive: true, force: true });
		logger.info(`Cleaned output directory: ${dirPath}`);
	} catch (error) {
		// Ignore if doesn't exist
	}
}

/**
 * Run the generator for all configured sources
 */
export async function runGenerator(config: AutomationConfig): Promise<RunResults> {
	logger.info('='.repeat(60));
	logger.info('Starting Swagger to Playwright API Client Generation');
	logger.info('='.repeat(60));

	const results: RunResults = {
		totalSources: config.sources.length,
		successful: 0,
		failed: 0,
		skipped: 0,
		results: [],
	};

	// Filter active sources
	const activeSources = config.sources.filter((s) => !s.skip);
	const skippedSources = config.sources.filter((s) => s.skip);
	results.skipped = skippedSources.length;

	if (skippedSources.length > 0) {
		logger.info(`Skipping ${skippedSources.length} source(s)`);
	}

	if (activeSources.length === 0) {
		logger.warn('No active sources to process. Check your automation-config.ts');
		return results;
	}

	// Generated clients go into a subfolder for safe cleanup
	const generatedClientsDir = path.join(config.outputDir, 'generatedClients');

	// Clean generated clients directory if configured (safe - doesn't touch BaseAPIClient etc.)
	if (config.cleanOutput) {
		await cleanDirectory(generatedClientsDir);
	}

	// Create generated clients directory
	await fs.promises.mkdir(generatedClientsDir, { recursive: true });

	// Process sources
	if (config.parallel) {
		// Parallel processing
		logger.info(`Processing ${activeSources.length} source(s) in parallel`);
		const promises = activeSources.map((source) =>
			processSource(source, generatedClientsDir, config.baseClientPath)
		);
		const allResults = await Promise.allSettled(promises);

		for (let i = 0; i < allResults.length; i++) {
			const settledResult = allResults[i];
			const source = activeSources[i];

			if (settledResult.status === 'fulfilled') {
				const result = settledResult.value;
				results.results.push({ source: source.source, result });
				if (result.success) {
					results.successful++;
				} else {
					results.failed++;
				}
			} else {
				results.failed++;
				results.results.push({
					source: source.source,
					result: {
						success: false,
						serviceName: '',
						filesWritten: [],
						folderStructure: '',
						errors: [settledResult.reason?.message || 'Unknown error'],
					},
				});
			}
		}
	} else {
		// Sequential processing
		for (const source of activeSources) {
			logger.info('-'.repeat(40));
			logger.info(`Processing: ${source.source}`);

			try {
				const result = await processSource(source, generatedClientsDir, config.baseClientPath);
				results.results.push({ source: source.source, result });

				if (result.success) {
					results.successful++;
					logger.info(`✓ Generated ${result.filesWritten.length} files for ${result.serviceName}`);
				} else {
					results.failed++;
					logger.error(`✗ Failed: ${result.errors.join(', ')}`);
				}
			} catch (error) {
				results.failed++;
				const errorMessage = error instanceof Error ? error.message : String(error);
				logger.error(`✗ Exception: ${errorMessage}`);
				results.results.push({
					source: source.source,
					result: {
						success: false,
						serviceName: '',
						filesWritten: [],
						folderStructure: '',
						errors: [errorMessage],
					},
				});
			}
		}
	}

	// Print summary
	logger.info('='.repeat(60));
	logger.info('Generation Complete');
	logger.info('='.repeat(60));
	logger.info(`Total Sources: ${results.totalSources}`);
	logger.info(`Successful: ${results.successful}`);
	logger.info(`Failed: ${results.failed}`);
	logger.info(`Skipped: ${results.skipped}`);

	if (results.failed > 0) {
		logger.warn('Some sources failed. Check the logs above for details.');
	}

	return results;
}
