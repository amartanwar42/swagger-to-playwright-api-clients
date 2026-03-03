/**
 * Path utilities for processing API endpoints
 * Handles path parsing, grouping, and organization
 */

import { PathItemObject } from '../types';
import { toPascalCase } from './naming';

/**
 * Determine the folder structure for an endpoint
 * Groups endpoints logically based on path segments
 */
export function determineFolderStructure(path: string): string[] {
	const segments = path.split('/').filter((s) => s && !s.startsWith('{') && !s.endsWith('}'));
	// Skip common prefixes
	const filtered = segments.filter((s) => !['api', 'v1', 'v2', 'v3'].includes(s.toLowerCase()));

	// If no segments after filtering, use Root folder
	if (filtered.length === 0) {
		return ['Root'];
	}

	// Check for therapist keyword - create dedicated folder
	for (const segment of filtered) {
		if (segment.toLowerCase().includes('therapist')) {
			return ['Therapist'];
		}
	}

	// Group by first meaningful segment
	// e.g., /pet/{petId}/uploadImage and /pet both go to Pet
	return [toPascalCase(filtered[0])];
}

/**
 * Strip path parameters from endpoint for base path
 * Example: "/api/v1/activity/{id}/items/{itemId}" -> "/api/v1/activity"
 */
export function stripPathParams(path: string): string {
	return path
		.split('/')
		.filter((s) => !s.startsWith('{'))
		.join('/');
}

/**
 * Generate template literal for path with params
 * Example: "/api/v1/activity/{id}" -> "`/api/v1/activity/${id}`"
 */
export function generatePathTemplate(path: string): string {
	const hasParams = path.includes('{');
	if (!hasParams) {
		return `'${path}'`;
	}
	// Convert {param} to ${param}
	const template = path.replace(/\{([^}]+)\}/g, '${$1}');
	return '`' + template + '`';
}

/**
 * Parse query parameters from path (if any exist in the path definition)
 */
export function parseQueryFromPath(path: string): {
	basePath: string;
	queryParams: string[];
} {
	const [basePath, query] = path.split('?');
	if (!query) {
		return { basePath, queryParams: [] };
	}

	const queryParams: string[] = [];
	const params = query.split('&');
	for (const param of params) {
		const [key] = param.split('=');
		if (key) {
			queryParams.push(key.replace(/[{}]/g, ''));
		}
	}

	return { basePath, queryParams };
}

/**
 * Group endpoints by their logical folder
 */
export interface EndpointGroup {
	folder: string[];
	endpoints: Array<{
		path: string;
		method: string;
		operationId?: string;
	}>;
}

export function groupEndpointsByFolder(
	paths: Record<string, PathItemObject>
): Map<string, EndpointGroup> {
	const groups = new Map<string, EndpointGroup>();

	for (const [path, pathItem] of Object.entries(paths)) {
		const folders = determineFolderStructure(path);
		const folderKey = folders.join('/');

		if (!groups.has(folderKey)) {
			groups.set(folderKey, {
				folder: folders,
				endpoints: [],
			});
		}

		const methods: Array<'get' | 'post' | 'put' | 'patch' | 'delete'> = [
			'get',
			'post',
			'put',
			'patch',
			'delete',
		];

		for (const method of methods) {
			const operation = pathItem[method];
			if (operation) {
				groups.get(folderKey)!.endpoints.push({
					path,
					method: method.toUpperCase(),
					operationId: operation.operationId,
				});
			}
		}
	}

	return groups;
}
