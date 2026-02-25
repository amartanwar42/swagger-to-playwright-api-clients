/**
 * Naming convention utilities for generating TypeScript code
 * Handles conversion between different case styles
 */

/**
 * Convert string to PascalCase
 * Example: "activity-plan-schedule" -> "ActivityPlanSchedule"
 */
export function toPascalCase(str: string): string {
	return str
		.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
		.replace(/^(.)/, (char) => char.toUpperCase())
		.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Convert string to camelCase
 * Example: "activity-plan-schedule" -> "activityPlanSchedule"
 */
export function toCamelCase(str: string): string {
	const pascal = toPascalCase(str);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert path parameter to "By{ParamName}" format
 * Example: "{id}" -> "ById", "{lessonId}" -> "ByLessonId"
 */
export function pathParamToByFormat(param: string): string {
	const cleanParam = param.replace(/[{}]/g, '');
	return `By${toPascalCase(cleanParam)}`;
}

/**
 * Generate type name from endpoint and method
 * Example: POST /api/v1/activity/activity-plan-schedule -> postActivityPlanScheduleRequest
 */
export function generateTypeName(
	method: string,
	resourceName: string,
	pathParams: string[],
	suffix: 'Request' | 'Response'
): string {
	const methodLower = method.toLowerCase();
	const resource = toPascalCase(resourceName);
	const paramSuffix = pathParams.map((p) => pathParamToByFormat(p)).join('');
	return `${methodLower}${resource}${paramSuffix}${suffix}`;
}

/**
 * Generate function name from endpoint and method
 * Example: GET /api/v1/activity/activity-plan-schedule/{id} -> getActivityPlanScheduleById
 */
export function generateFunctionName(
	method: string,
	resourceName: string,
	pathParams: string[]
): string {
	const methodLower = method.toLowerCase();
	const resource = toPascalCase(resourceName);
	const paramSuffix = pathParams.map((p) => pathParamToByFormat(p)).join('');
	return `${methodLower}${resource}${paramSuffix}`;
}

/**
 * Extract resource name from path
 * Example: "/api/v1/activity/activity-plan-schedule/{id}" -> "ActivityPlanSchedule"
 */
export function extractResourceName(path: string): string {
	// Remove path parameters and split by /
	const segments = path.split('/').filter((s) => s && !s.startsWith('{') && !s.endsWith('}'));

	// Skip common prefixes like api, v1, v2, etc.
	const filteredSegments = segments.filter(
		(s) => !['api', 'v1', 'v2', 'v3'].includes(s.toLowerCase())
	);

	// Take the last meaningful segments
	if (filteredSegments.length === 0) return 'Root';

	// Join last 2-3 segments to form resource name
	const relevantSegments = filteredSegments.slice(-3);
	return relevantSegments.map((s) => toPascalCase(s)).join('');
}

/**
 * Extract path parameters from endpoint path
 * Example: "/api/v1/activity/{id}/items/{itemId}" -> ["id", "itemId"]
 */
export function extractPathParams(path: string): string[] {
	const matches = path.match(/\{([^}]+)\}/g);
	if (!matches) return [];
	return matches.map((m) => m.replace(/[{}]/g, ''));
}

/**
 * Sanitize a name to be a valid TypeScript identifier
 */
export function sanitizeIdentifier(name: string): string {
	// Remove invalid characters and ensure it starts with a letter
	let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '');
	if (/^[0-9]/.test(sanitized)) {
		sanitized = '_' + sanitized;
	}
	return sanitized || '_unknown';
}

/**
 * Convert schema property name to valid TypeScript property
 */
export function sanitizePropertyName(name: string): string {
	// If name contains special characters, wrap in quotes
	if (/[^a-zA-Z0-9_$]/.test(name) || /^[0-9]/.test(name)) {
		return `'${name}'`;
	}
	return name;
}
