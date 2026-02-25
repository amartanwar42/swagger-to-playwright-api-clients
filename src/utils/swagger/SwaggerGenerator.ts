/**
 * SwaggerGenerator - Main entry point for generating API clients from Swagger/OpenAPI
 * Orchestrates parsing, type generation, client generation, and file writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { SwaggerParser } from './SwaggerParser';
import { TypeGenerator } from './TypeGenerator';
import { ClientGenerator } from './ClientGenerator';
import { FileWriter } from './FileWriter';
import { SwaggerDocument, ParsedEndpoint } from './types';
import { groupEndpointsByFolder, EndpointGroup } from './utils/pathUtils';
import { toPascalCase } from './utils/naming';
import logger from '../logger';

export interface GeneratorOptions {
	outputDir: string;
	serviceName?: string;
	baseClientPath?: string;
}

export interface GeneratorResult {
	success: boolean;
	serviceName: string;
	filesWritten: string[];
	folderStructure: string;
	errors: string[];
}

export class SwaggerGenerator {
	private options: GeneratorOptions;

	constructor(options: GeneratorOptions) {
		this.options = {
			baseClientPath: '../../clients/BaseAPIClient',
			...options,
		};
	}

	/**
	 * Generate API client from Swagger/OpenAPI JSON file
	 */
	async generateFromFile(filePath: string): Promise<GeneratorResult> {
		logger.info(`Reading Swagger file: ${filePath}`);

		try {
			const content = await fs.promises.readFile(filePath, 'utf-8');
			const document = JSON.parse(content) as SwaggerDocument;
			return this.generate(document);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to read Swagger file: ${errorMessage}`);
			return {
				success: false,
				serviceName: '',
				filesWritten: [],
				folderStructure: '',
				errors: [`Failed to read file: ${errorMessage}`],
			};
		}
	}

	/**
	 * Generate API client from Swagger/OpenAPI URL
	 */
	async generateFromUrl(url: string): Promise<GeneratorResult> {
		logger.info(`Fetching Swagger from URL: ${url}`);

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			const document = (await response.json()) as SwaggerDocument;
			return this.generate(document);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to fetch Swagger from URL: ${errorMessage}`);
			return {
				success: false,
				serviceName: '',
				filesWritten: [],
				folderStructure: '',
				errors: [`Failed to fetch URL: ${errorMessage}`],
			};
		}
	}

	/**
	 * Generate API client from Swagger/OpenAPI document object
	 */
	async generate(document: SwaggerDocument): Promise<GeneratorResult> {
		const errors: string[] = [];

		try {
			// Initialize parser
			const parser = new SwaggerParser(document);
			const serviceName = this.options.serviceName || parser.getServiceName();

			logger.info(`Generating API client for: ${serviceName}`);
			logger.info(`OpenAPI version: ${parser.isSwagger2() ? '2.0' : '3.x'}`);

			// Parse all endpoints
			const endpoints = parser.parseEndpoints();
			logger.info(`Found ${endpoints.length} endpoints`);

			// Initialize generators
			const typeGenerator = new TypeGenerator(parser);
			const clientGenerator = new ClientGenerator(typeGenerator, this.options.baseClientPath);
			const fileWriter = new FileWriter(this.options.outputDir);

			// Generate types for all endpoints
			typeGenerator.generateAllTypes(endpoints);

			// Group endpoints by folder
			const groups = groupEndpointsByFolder(document.paths, serviceName);

			// Generate files for each group
			for (const [folderKey, group] of groups) {
				const folderPath = group.folder;

				// Get endpoints for this group
				const groupEndpoints: ParsedEndpoint[] = [];
				for (const ep of group.endpoints) {
					const found = endpoints.find((e) => e.path === ep.path && e.method === ep.method);
					if (found) {
						groupEndpoints.push(found);
					}
				}

				if (groupEndpoints.length === 0) continue;

				// Generate types for this group
				const groupTypeGenerator = new TypeGenerator(parser);
				groupTypeGenerator.generateAllTypes(groupEndpoints);
				const typeDefinitions = groupTypeGenerator.generateTypeDeclarations();

				// Get type imports for client
				const typeImports: string[] = [];
				for (const endpoint of groupEndpoints) {
					const requestType = groupTypeGenerator.getRequestTypeName(endpoint);
					const responseType = groupTypeGenerator.getResponseTypeName(endpoint);
					if (requestType && !typeImports.includes(requestType)) {
						typeImports.push(requestType);
					}
					if (responseType && !typeImports.includes(responseType)) {
						typeImports.push(responseType);
					}
				}

				// Generate client class
				const className = `${folderPath.join('')}Client`;
				const clientCode = clientGenerator.generateClientClass(
					className,
					groupEndpoints,
					typeImports
				);

				// Add files
				if (typeDefinitions.trim()) {
					fileWriter.addTypesFile(folderPath, typeDefinitions);
				}
				fileWriter.addClientFile(folderPath, className, clientCode);
			}

			// Preview structure
			const folderStructure = fileWriter.previewStructure();
			logger.info(`Folder structure:\n${folderStructure}`);

			// Write all files
			const filesWritten = await fileWriter.writeAll();
			logger.info(`Generated ${filesWritten.length} files`);

			return {
				success: true,
				serviceName,
				filesWritten,
				folderStructure,
				errors,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Generation failed: ${errorMessage}`);
			errors.push(errorMessage);
			return {
				success: false,
				serviceName: '',
				filesWritten: [],
				folderStructure: '',
				errors,
			};
		}
	}
}

/**
 * Convenience function to generate from file
 */
export async function generateFromFile(
	filePath: string,
	outputDir: string,
	serviceName?: string
): Promise<GeneratorResult> {
	const generator = new SwaggerGenerator({ outputDir, serviceName });
	return generator.generateFromFile(filePath);
}

/**
 * Convenience function to generate from URL
 */
export async function generateFromUrl(
	url: string,
	outputDir: string,
	serviceName?: string
): Promise<GeneratorResult> {
	const generator = new SwaggerGenerator({ outputDir, serviceName });
	return generator.generateFromUrl(url);
}
