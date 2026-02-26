/**
 * Code formatter utility using Prettier
 */

import * as prettier from 'prettier';
import * as fs from 'fs';
import * as path from 'path';
import logger from './logger';

// Cache for prettier options
let cachedOptions: prettier.Options | null = null;
let cachedConfigPath: string | false | undefined = undefined;

/**
 * Load Prettier configuration
 * @param configPath - Path to prettier config file, false to disable, or undefined for auto-detect
 */
export async function loadPrettierConfig(
	configPath?: string | false
): Promise<prettier.Options | null> {
	// Return null if formatting is disabled
	if (configPath === false) {
		return null;
	}

	// Use cache if config path hasn't changed
	if (cachedOptions !== null && cachedConfigPath === configPath) {
		return cachedOptions;
	}

	cachedConfigPath = configPath;

	try {
		let options: prettier.Options | null = null;

		if (configPath) {
			// Load from specified config file
			const absolutePath = path.isAbsolute(configPath)
				? configPath
				: path.join(process.cwd(), configPath);

			if (fs.existsSync(absolutePath)) {
				options = await prettier.resolveConfig(absolutePath);
				logger.info(`Loaded Prettier config from: ${absolutePath}`);
			} else {
				logger.warn(`Prettier config not found at: ${absolutePath}, using defaults`);
			}
		} else {
			// Auto-detect prettier config from project root
			options = await prettier.resolveConfig(process.cwd());
			if (options) {
				logger.info('Using Prettier config from project root');
			}
		}

		// Use default options if no config found
		if (!options) {
			options = {
				parser: 'typescript',
				useTabs: true,
				singleQuote: true,
				trailingComma: 'es5',
				printWidth: 100,
			};
			logger.info('Using default Prettier options');
		}

		// Ensure parser is set for TypeScript
		options.parser = 'typescript';

		cachedOptions = options;
		return options;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.warn(`Failed to load Prettier config: ${message}, using defaults`);
		cachedOptions = {
			parser: 'typescript',
			useTabs: true,
			singleQuote: true,
			trailingComma: 'es5',
			printWidth: 100,
		};
		return cachedOptions;
	}
}

/**
 * Format code using Prettier
 * @param code - The code to format
 * @param options - Prettier options (from loadPrettierConfig)
 * @returns Formatted code or original if formatting fails/disabled
 */
export async function formatCode(code: string, options: prettier.Options | null): Promise<string> {
	if (!options) {
		return code;
	}

	try {
		return await prettier.format(code, options);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.warn(`Prettier formatting failed: ${message}`);
		return code;
	}
}

/**
 * Format a file in place
 * @param filePath - Path to the file to format
 * @param options - Prettier options (from loadPrettierConfig)
 */
export async function formatFile(
	filePath: string,
	options: prettier.Options | null
): Promise<void> {
	if (!options) {
		return;
	}

	try {
		const content = await fs.promises.readFile(filePath, 'utf-8');
		const formatted = await prettier.format(content, options);
		await fs.promises.writeFile(filePath, formatted, 'utf-8');
		logger.debug(`Formatted: ${filePath}`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.warn(`Failed to format ${filePath}: ${message}`);
	}
}

/**
 * Format multiple files
 * @param filePaths - Array of file paths to format
 * @param configPath - Path to prettier config file, false to disable, or undefined for auto-detect
 */
export async function formatFiles(filePaths: string[], configPath?: string | false): Promise<void> {
	const options = await loadPrettierConfig(configPath);

	if (!options) {
		logger.info('Prettier formatting disabled');
		return;
	}

	logger.info(`Formatting ${filePaths.length} file(s) with Prettier...`);

	for (const filePath of filePaths) {
		await formatFile(filePath, options);
	}

	logger.info('Formatting complete');
}

/**
 * Clear the cached prettier options
 */
export function clearPrettierCache(): void {
	cachedOptions = null;
	cachedConfigPath = undefined;
}
