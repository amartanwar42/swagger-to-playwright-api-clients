/**
 * FixtureGenerator - Generates a Playwright fixtures file that exports
 * a custom `test` object with all generated API clients as fixtures.
 */

import * as fs from 'fs';
import * as path from 'path';
import { toCamelCase } from './utils/naming';
import logger from '../logger';

interface ClientInfo {
	className: string;
	importPath: string;
	fixtureName: string;
}

/**
 * Scan the generatedClients directory and collect all *Client.ts files.
 * Import paths are computed relative to fixturesDir.
 */
async function discoverClients(
	generatedClientsDir: string,
	fixturesDir: string
): Promise<ClientInfo[]> {
	const clients: ClientInfo[] = [];

	if (!fs.existsSync(generatedClientsDir)) {
		return clients;
	}

	const entries = await fs.promises.readdir(generatedClientsDir, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const folderPath = path.join(generatedClientsDir, entry.name);
		await scanFolder(folderPath, generatedClientsDir, fixturesDir, clients);
	}

	// Sort alphabetically by fixture name for deterministic output
	clients.sort((a, b) => a.fixtureName.localeCompare(b.fixtureName));
	return clients;
}

/**
 * Recursively scan folders for *Client.ts files.
 * Computes import paths relative to fixturesDir.
 */
async function scanFolder(
	dirPath: string,
	generatedClientsDir: string,
	fixturesDir: string,
	clients: ClientInfo[]
): Promise<void> {
	const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			await scanFolder(path.join(dirPath, entry.name), generatedClientsDir, fixturesDir, clients);
		} else if (entry.isFile() && entry.name.endsWith('Client.ts')) {
			const className = entry.name.replace('.ts', '');
			const absoluteClientPath = path.join(dirPath, className);
			// Compute relative path from fixturesDir to the client file
			let importPath = path.relative(fixturesDir, absoluteClientPath);
			// Ensure it starts with ./ for a relative import
			if (!importPath.startsWith('.')) {
				importPath = './' + importPath;
			}
			// Normalize to forward slashes for TypeScript imports
			importPath = importPath.replace(/\\/g, '/');
			const fixtureName = toCamelCase(className);

			clients.push({ className, importPath, fixtureName });
		}
	}
}

/**
 * Generate the fixtures file content
 */
function generateFixtureContent(clients: ClientInfo[], baseClientImport: string): string {
	if (clients.length === 0) {
		return '';
	}

	const imports = clients
		.map((c) => `import { ${c.className} } from '${c.importPath}';`)
		.join('\n');

	const typeProps = clients.map((c) => `  ${c.fixtureName}: ${c.className};`).join('\n');

	const fixtures = clients
		.map(
			(c) =>
				`  ${c.fixtureName}: async ({ baseAPIClient }, use) => {\n` +
				`    await use(new ${c.className}(baseAPIClient));\n` +
				`  },`
		)
		.join('\n\n');

	return `/**
 * Auto-generated Playwright fixtures for API clients
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

import { test as base } from '@playwright/test';
import { BaseAPIClient } from '${baseClientImport}';
${imports}

type APIFixtures = {
  baseAPIClient: BaseAPIClient;
${typeProps}
};

export const test = base.extend<APIFixtures>({
  baseAPIClient: async ({}, use) => {
    const client = new BaseAPIClient(
      process.env.BASE_URL || 'http://localhost:3000',
      {}
    );
    await client.init();
    await use(client);
    await client.dispose();
  },

${fixtures}
});

export { expect } from '@playwright/test';
`;
}

/**
 * Generate and write the fixtures file.
 * @param outputDir - The directory containing generatedClients/ and BaseAPIClient.ts
 * @param fixturesDir - Optional custom directory to write the fixture file into.
 *                       Defaults to outputDir when not provided.
 */
export async function generateFixturesFile(
	outputDir: string,
	fixturesDir?: string
): Promise<string | null> {
	const generatedClientsDir = path.join(outputDir, 'generatedClients');
	const resolvedFixturesDir = fixturesDir ? path.resolve(fixturesDir) : path.resolve(outputDir);

	logger.info('Generating Playwright fixtures file...');

	const clients = await discoverClients(generatedClientsDir, resolvedFixturesDir);

	if (clients.length === 0) {
		logger.warn('No generated clients found — skipping fixtures file generation');
		return null;
	}

	// Compute BaseAPIClient import path relative to fixturesDir
	const baseClientAbsolute = path.join(path.resolve(outputDir), 'BaseAPIClient');
	let baseClientImport = path.relative(resolvedFixturesDir, baseClientAbsolute);
	if (!baseClientImport.startsWith('.')) {
		baseClientImport = './' + baseClientImport;
	}
	baseClientImport = baseClientImport.replace(/\\/g, '/');

	const content = generateFixtureContent(clients, baseClientImport);

	// Ensure fixturesDir exists
	await fs.promises.mkdir(resolvedFixturesDir, { recursive: true });

	const fixturesPath = path.join(resolvedFixturesDir, 'fixtures.ts');
	await fs.promises.writeFile(fixturesPath, content, 'utf-8');
	logger.info(`Generated fixtures file with ${clients.length} client(s): ${fixturesPath}`);

	return fixturesPath;
}
