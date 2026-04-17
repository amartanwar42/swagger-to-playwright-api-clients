/**
 * Utility to copy helper/utility files to user's project
 *
 * Copies:
 *   utils/  — TestDataGenerator, ApiAssertions, TypeValidator, SecurityPayloads
 *   helpers/ — ApiStatusCodes, SetupHelpers
 *
 * Files are written to the PARENT of outputDir so they land in src/utils/ and
 * src/helpers/ when outputDir is src/clients/. Override with helperFunctionsDir.
 */

import * as fs from 'fs';
import * as path from 'path';
import logger from './logger';
import {
	API_STATUS_CODES_CONTENT,
	API_ASSERTIONS_CONTENT,
	TYPE_VALIDATOR_CONTENT,
	TEST_DATA_GENERATOR_CONTENT,
	SECURITY_PAYLOADS_CONTENT,
	SETUP_HELPERS_CONTENT,
} from './templates';

// ── File map ─────────────────────────────────────────────────────────────

interface HelperFile {
	/** Relative path from the base dir (parent of outputDir, i.e. src/) */
	relativePath: string;
	content: string;
}

const HELPER_FILES: HelperFile[] = [
	// utils/
	{ relativePath: 'utils/TestDataGenerator.ts', content: TEST_DATA_GENERATOR_CONTENT },
	{ relativePath: 'utils/ApiAssertions.ts', content: API_ASSERTIONS_CONTENT },
	{ relativePath: 'utils/TypeValidator.ts', content: TYPE_VALIDATOR_CONTENT },
	{ relativePath: 'utils/SecurityPayloads.ts', content: SECURITY_PAYLOADS_CONTENT },
	// helpers/
	{ relativePath: 'helpers/ApiStatusCodes.ts', content: API_STATUS_CODES_CONTENT },
	{ relativePath: 'helpers/SetupHelpers.ts', content: SETUP_HELPERS_CONTENT },
];

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Copy all helper/utility files to the user's project.
 *
 * By default, files are written to the PARENT of outputDir so that when
 * outputDir is `src/clients/`, helpers land at `src/utils/` and `src/helpers/`.
 *
 * Override with an explicit `helperFunctionsDir` to write elsewhere.
 *
 * @param outputDir          The main outputDir from config (e.g. `src/clients/`)
 * @param helperFunctionsDir Optional explicit base dir for helpers
 * @returns Array of absolute paths of written files
 */
export async function copyHelpers(
	outputDir: string,
	helperFunctionsDir?: string
): Promise<string[]> {
	const baseDir = helperFunctionsDir
		? path.resolve(helperFunctionsDir)
		: path.resolve(outputDir, '..');

	logger.info(`Copying helper functions to: ${baseDir}`);

	const written: string[] = [];

	for (const file of HELPER_FILES) {
		const targetPath = path.join(baseDir, file.relativePath);

		// Ensure parent directory exists
		await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });

		await fs.promises.writeFile(targetPath, file.content, 'utf-8');
		logger.info(`Helper copied to: ${targetPath}`);
		written.push(targetPath);
	}

	logger.info(`Copied ${written.length} helper file(s)`);
	return written;
}
