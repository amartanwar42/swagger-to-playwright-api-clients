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
 * Scan the generatedClients directory and collect all *Client.ts files
 */
async function discoverClients(generatedClientsDir: string): Promise<ClientInfo[]> {
	const clients: ClientInfo[] = [];

	if (!fs.existsSync(generatedClientsDir)) {
		return clients;
	}

	const entries = await fs.promises.readdir(generatedClientsDir, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const folderPath = path.join(generatedClientsDir, entry.name);
		await scanFolder(folderPath, [entry.name], clients);
	}

	// Sort alphabetically by fixture name for deterministic output
	clients.sort((a, b) => a.fixtureName.localeCompare(b.fixtureName));
	return clients;
}

/**
 * Recursively scan folders for *Client.ts files
 */
async function scanFolder(
	dirPath: string,
	relativeParts: string[],
	clients: ClientInfo[]
): Promise<void> {
	const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			await scanFolder(path.join(dirPath, entry.name), [...relativeParts, entry.name], clients);
		} else if (entry.isFile() && entry.name.endsWith('Client.ts')) {
			const className = entry.name.replace('.ts', '');
			const importPath = `./generatedClients/${relativeParts.join('/')}/${className}`;
			const fixtureName = toCamelCase(className);

			clients.push({ className, importPath, fixtureName });
		}
	}
}

/**
 * Generate the fixtures file content
 */
function generateFixtureContent(clients: ClientInfo[]): string {
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
import { BaseAPIClient } from './BaseAPIClient';
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
 * Generate and write the fixtures file to the output directory
 */
export async function generateFixturesFile(outputDir: string): Promise<string | null> {
	const generatedClientsDir = path.join(outputDir, 'generatedClients');

	logger.info('Generating Playwright fixtures file...');

	const clients = await discoverClients(generatedClientsDir);

	if (clients.length === 0) {
		logger.warn('No generated clients found — skipping fixtures file generation');
		return null;
	}

	const content = generateFixtureContent(clients);
	const fixturesPath = path.join(outputDir, 'fixtures.ts');

	await fs.promises.writeFile(fixturesPath, content, 'utf-8');
	logger.info(`Generated fixtures file with ${clients.length} client(s): ${fixturesPath}`);

	return fixturesPath;
}
