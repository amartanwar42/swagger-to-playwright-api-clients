/**
 * FileWriter - Handles file organization and writing for generated code
 * Creates proper folder structure and writes TypeScript files
 */

import * as fs from 'fs';
import * as path from 'path';
import { toPascalCase } from './utils/naming';

export interface FileOutput {
	filePath: string;
	content: string;
}

export interface FolderStructure {
	serviceName: string;
	folders: Map<string, FileOutput[]>;
}

export class FileWriter {
	private outputDir: string;
	private files: FileOutput[] = [];

	constructor(outputDir: string) {
		this.outputDir = outputDir;
	}

	/**
	 * Add a file to be written
	 */
	addFile(relativePath: string, content: string): void {
		this.files.push({
			filePath: path.join(this.outputDir, relativePath),
			content: this.formatContent(content),
		});
	}

	/**
	 * Add types file for a service folder
	 */
	addTypesFile(folderPath: string[], typeDefinitions: string): void {
		const relativePath = path.join(...folderPath, 'types.ts');
		const content = `/**
 * Auto-generated TypeScript types
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

${typeDefinitions}
`;
		this.addFile(relativePath, content);
	}

	/**
	 * Add client file for a service folder
	 */
	addClientFile(folderPath: string[], className: string, content: string): void {
		const fileName = `${className}.ts`;
		const relativePath = path.join(...folderPath, fileName);
		const headerContent = `/**
 * Auto-generated API Client
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

${content}`;
		this.addFile(relativePath, headerContent);
	}

	/**
	 * Add index file for exports
	 */
	addIndexFile(folderPath: string[], exports: string[]): void {
		const relativePath = path.join(...folderPath, 'index.ts');
		const content = exports.map((e) => `export * from './${e}';`).join('\n');
		this.addFile(relativePath, `${content}\n`);
	}

	/**
	 * Add root index file that exports all services
	 */
	addRootIndex(serviceFolders: string[]): void {
		const exports = serviceFolders.map((folder) => {
			const pascalName = toPascalCase(folder);
			return `export * as ${pascalName} from './${folder}';`;
		});
		this.addFile('index.ts', exports.join('\n') + '\n');
	}

	/**
	 * Write all files to disk
	 */
	async writeAll(): Promise<string[]> {
		const writtenFiles: string[] = [];

		for (const file of this.files) {
			await this.ensureDir(path.dirname(file.filePath));
			await fs.promises.writeFile(file.filePath, file.content, 'utf-8');
			writtenFiles.push(file.filePath);
		}

		return writtenFiles;
	}

	/**
	 * Get all files to be written (for preview)
	 */
	getFiles(): FileOutput[] {
		return this.files;
	}

	/**
	 * Preview the folder structure
	 */
	previewStructure(): string {
		const tree: string[] = [];
		const dirs = new Set<string>();

		// Sort files for consistent output
		const sortedFiles = [...this.files].sort((a, b) => a.filePath.localeCompare(b.filePath));

		for (const file of sortedFiles) {
			const relativePath = path.relative(this.outputDir, file.filePath);
			const parts = relativePath.split(path.sep);

			// Add directories
			let currentPath = '';
			for (let i = 0; i < parts.length - 1; i++) {
				currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
				if (!dirs.has(currentPath)) {
					dirs.add(currentPath);
					const indent = '  '.repeat(i);
					tree.push(`${indent}${parts[i]}/`);
				}
			}

			// Add file
			const indent = '  '.repeat(parts.length - 1);
			tree.push(`${indent}${parts[parts.length - 1]}`);
		}

		return tree.join('\n');
	}

	/**
	 * Ensure directory exists
	 */
	private async ensureDir(dirPath: string): Promise<void> {
		try {
			await fs.promises.mkdir(dirPath, { recursive: true });
		} catch (error) {
			// Ignore if already exists
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
				throw error;
			}
		}
	}

	/**
	 * Format content with proper indentation
	 */
	private formatContent(content: string): string {
		// Basic cleanup - remove multiple blank lines
		return content.replace(/\n{3,}/g, '\n\n').trim() + '\n';
	}

	/**
	 * Clear all pending files
	 */
	clear(): void {
		this.files = [];
	}

	/**
	 * Get output directory
	 */
	getOutputDir(): string {
		return this.outputDir;
	}
}
