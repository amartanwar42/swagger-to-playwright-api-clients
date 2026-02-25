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
		results: GeneratorResult[];
	}>;
}

/**
 * Process a single swagger source (file or URL)
 */
async function processSingleSource(
	filePath: string,
	outputDir: string,
	serviceName: string | undefined,
	baseClientPath: string
): Promise<GeneratorResult> {
	const generator = new SwaggerGenerator({
		outputDir,
		serviceName,
		baseClientPath,
	});
	return generator.generateFromFile(filePath);
}

/**
 * Process a directory containing swagger JSON files
 */
async function processDirectory(
	dirPath: string,
	outputDir: string,
	serviceName: string | undefined,
	baseClientPath: string
): Promise<GeneratorResult[]> {
	const results: GeneratorResult[] = [];

	try {
		const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
		const jsonFiles = entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
			.map((entry) => entry.name);

		if (jsonFiles.length === 0) {
			logger.warn(`No JSON files found in directory: ${dirPath}`);
			return [
				{
					success: false,
					serviceName: serviceName || '',
					filesWritten: [],
					folderStructure: '',
					errors: [`No JSON files found in directory: ${dirPath}`],
				},
			];
		}

		logger.info(`Found ${jsonFiles.length} JSON file(s) in directory: ${dirPath}`);

		for (const jsonFile of jsonFiles) {
			const filePath = path.join(dirPath, jsonFile);
			// Use filename (without extension) as service name if not provided
			const fileServiceName = serviceName || path.basename(jsonFile, '.json');
			logger.info(`Processing: ${jsonFile}`);

			const result = await processSingleSource(
				filePath,
				outputDir,
				fileServiceName,
				baseClientPath
			);
			results.push(result);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(`Failed to read directory: ${errorMessage}`);
		results.push({
			success: false,
			serviceName: serviceName || '',
			filesWritten: [],
			folderStructure: '',
			errors: [`Failed to read directory: ${errorMessage}`],
		});
	}

	return results;
}

/**
 * Process a single swagger source (can be file, directory, or URL)
 */
async function processSource(
	sourceConfig: SwaggerSourceConfig,
	globalOutputDir: string,
	baseClientPath?: string
): Promise<GeneratorResult[]> {
	const outputDir = sourceConfig.outputDir || globalOutputDir;
	const clientPath = baseClientPath || DEFAULT_BASE_CLIENT_PATH;

	if (sourceConfig.type === 'file') {
		// Resolve file path relative to project root
		const sourcePath = path.isAbsolute(sourceConfig.source)
			? sourceConfig.source
			: path.join(process.cwd(), sourceConfig.source);

		// Check if source is a directory or file
		try {
			const stats = await fs.promises.stat(sourcePath);

			if (stats.isDirectory()) {
				return processDirectory(sourcePath, outputDir, sourceConfig.serviceName, clientPath);
			} else {
				const result = await processSingleSource(
					sourcePath,
					outputDir,
					sourceConfig.serviceName,
					clientPath
				);
				return [result];
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return [
				{
					success: false,
					serviceName: sourceConfig.serviceName || '',
					filesWritten: [],
					folderStructure: '',
					errors: [`Failed to access source: ${errorMessage}`],
				},
			];
		}
	} else {
		// URL source
		const generator = new SwaggerGenerator({
			outputDir,
			serviceName: sourceConfig.serviceName,
			baseClientPath: clientPath,
		});
		const result = await generator.generateFromUrl(sourceConfig.source);
		return [result];
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
				const sourceResults = settledResult.value;
				results.results.push({ source: source.source, results: sourceResults });
				for (const result of sourceResults) {
					if (result.success) {
						results.successful++;
					} else {
						results.failed++;
					}
				}
			} else {
				results.failed++;
				results.results.push({
					source: source.source,
					results: [
						{
							success: false,
							serviceName: '',
							filesWritten: [],
							folderStructure: '',
							errors: [settledResult.reason?.message || 'Unknown error'],
						},
					],
				});
			}
		}
	} else {
		// Sequential processing
		for (const source of activeSources) {
			logger.info('-'.repeat(40));
			logger.info(`Processing: ${source.source}`);

			try {
				const sourceResults = await processSource(
					source,
					generatedClientsDir,
					config.baseClientPath
				);
				results.results.push({ source: source.source, results: sourceResults });

				for (const result of sourceResults) {
					if (result.success) {
						results.successful++;
						logger.info(
							`✓ Generated ${result.filesWritten.length} files for ${result.serviceName}`
						);
					} else {
						results.failed++;
						logger.error(`✗ Failed: ${result.errors.join(', ')}`);
					}
				}
			} catch (error) {
				results.failed++;
				const errorMessage = error instanceof Error ? error.message : String(error);
				logger.error(`✗ Exception: ${errorMessage}`);
				results.results.push({
					source: source.source,
					results: [
						{
							success: false,
							serviceName: '',
							filesWritten: [],
							folderStructure: '',
							errors: [errorMessage],
						},
					],
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
