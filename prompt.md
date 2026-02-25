You are a senior TypeScript architect and code generator expert.

Your task is to generate a TypeScript utility that dynamically generates API clients from a Swagger/OpenAPI JSON specification.

The BaseClient class is already implemented and must be used for all HTTP requests.

The generator must support all modern Swagger/OpenAPI versions:

- Swagger 2.0
- OpenAPI 3.x (including 3.1)

The generated output must be clean, scalable, and production-ready.

---

## CONFIGURATION

1. Automation Config Location

- The `automation-config.ts` file must be kept in the project root directory.
- It exports configuration for swagger sources, output directory, and settings.

2. Configuration Options

```typescript
interface AutomationConfig {
	outputDir: string; // Base output directory for generated clients
	baseClientPath?: string; // Relative import path to BaseAPIClient from generated files
	cleanOutput?: boolean; // Whether to clean output before generation
	parallel?: boolean; // Process sources in parallel
	sources: SwaggerSourceConfig[];
}
```

3. BaseClientPath

- Must be a relative import path (e.g., `'../../../BaseAPIClient'`)
- NOT an absolute filesystem path
- Path is relative from the generated client files to BaseAPIClient

---

## OUTPUT STRUCTURE

1. Generated Clients Folder

- All generated clients go into a `generatedClients` subfolder inside outputDir
- This allows safe cleanup without deleting BaseAPIClient or other manual files
- Example structure:
  ```
  src/clients/
    BaseAPIClient.ts          ← preserved (not generated)
    generatedClients/         ← this folder gets cleaned when cleanOutput=true
      ActivityService/
        Activity/
          types.ts
          ActivityServiceActivityClient.ts
  ```

2. No Index Files

- Do NOT generate index.ts files for exports
- Each folder only contains types.ts and the client file

3. Root Folder for Simple Endpoints

- Endpoints with only one path segment after filtering (e.g., `/health`, `/metrics`, `/api/v1/status`)
- These should be placed in a `Root` subfolder
- Example: `/api/v1/health` → `ServiceName/Root/`

---

## CORE REQUIREMENTS

1. File Separation

- Endpoints, clients, and types must be saved in separate files.
- The generator must automatically organize files properly.
- The structure must be scalable and easy to maintain.

2. Naming Conventions

- All file names must be in PascalCase.
- All types, functions, and variables must be in camelCase.
- Do NOT use snake_case or kebab-case in generated TypeScript code.

3. Folder Structure Rules

- Create a root folder using the service name.
  Example:
  activityService/

- Group endpoints logically.
  Example:
  /api/v1/training/complete
  /api/v1/training/delete
  → should be placed inside:
  activityService/training/

- If the endpoint contains the word "therapist",
  create a dedicated folder:
  activityService/therapist/

- Similar endpoints must be grouped under the same folder.

---

## NAMING RULES FOR TYPES AND CLIENT FUNCTIONS

Type Naming Convention:
<method><ResourceName><OptionalSuffix>Request
<method><ResourceName><OptionalSuffix>Response

Client Function Naming Convention:
<method><ResourceName><OptionalSuffix>

Rules:

- HTTP method must be lowercase (get, post, put, delete, patch)
- Resource names must be converted to PascalCase internally but exposed in camelCase
- Path params must be converted to "By{ParamName}"

Type Generation Rules:

- Request types: ONLY generate when endpoint has a requestBody
  - Do NOT generate request types for query parameters only
  - Query parameters are handled inline in the function signature
- Response types: ALWAYS generate
  - If response schema is not defined or empty `{}`, use `any` as the type
  - Example: `export type getHealthResponse = any;`

Examples:

1.  Endpoint: /api/v1/activity/activity-plan-schedule
    Method: POST (with requestBody)

Types:

- postActivityPlanScheduleRequest (generated from requestBody schema)
- postActivityPlanScheduleResponse (generated from response schema or `any`)

Client:
postActivityPlanSchedule(data: postActivityPlanScheduleRequest, options?: RequestOptions)

2.  Endpoint: /api/v1/activity/activity-plan-schedule/complete
    Method: PUT (with requestBody)

Types:

- putActivityPlanCompleteRequest
- putActivityPlanCompleteResponse

Client:
putActivityPlanComplete(data: putActivityPlanCompleteRequest, options?: RequestOptions)

3.  Endpoint: /api/v1/activity/activity-plan-schedule/{id}
    Method: GET (no requestBody, only path param)

Types:

- getActivityPlanScheduleByIdResponse (NO request type - only path param)

Client:
getActivityPlanScheduleById(id: string, options?: RequestOptions)

4.  Endpoint: /api/v1/activity/activity-plan-schedule/{lessonId}
    Method: GET

Types:

- getActivityPlanScheduleByLessonIdResponse

Client:
getActivityPlanScheduleByLessonId(lessonId: string, options?: RequestOptions)

5.  Endpoint: /health
    Method: GET (no schema defined)

Types:

- getHealthResponse = any

Client:
getHealth(options?: RequestOptions)
Folder: ServiceName/Root/

---

## PATH PARAMS & QUERY PARAMS HANDLING

1. Path Parameters

Example:
Endpoint: /api/v1/activity/activity-plan-schedule/{id}

You must:

- Store endpoint as:
  /api/v1/activity/activity-plan-schedule
- Accept path params as function arguments
- Replace path params dynamically before making request

Example client:

```typescript
getActivityPlanScheduleById = async (
	id: string,
	options?: RequestOptions
): Promise<APIResponseResult<getActivityPlanScheduleByIdResponse>> => {
	return this.client.get(`/api/v1/activity/activity-plan-schedule/${id}`, options);
};
```

2. Query Parameters

Example:
Endpoint:
/api/v1/activity/activity-plan-schedule?lessonId={lessonId}

You must:

- Store endpoint as:
  /api/v1/activity/activity-plan-schedule
- Accept query params as inline function parameters (NOT as a generated type)
- Append query params dynamically

Example:

```typescript
getActivityPlanSchedule = async (
	params?: { lessonId?: string },
	options?: RequestOptions
): Promise<APIResponseResult<getActivityPlanScheduleResponse>> => {
	const reqOptions = { ...options, params };
	return this.client.get('/api/v1/activity/activity-plan-schedule', reqOptions);
};
```

3. DELETE with Body

Example:
Endpoint: DELETE /api/v1/activity/activity-plan-schedule
With requestBody defined in swagger

```typescript
deleteActivityPlanSchedule = async (
	data: deleteActivityPlanScheduleRequest,
	options?: RequestOptions
): Promise<APIResponseResult<deleteActivityPlanScheduleResponse>> => {
	return this.client.delete('/api/v1/activity/activity-plan-schedule', data, options);
};
```

---

## GENERATOR DESIGN REQUIREMENTS

- The utility must parse:
  - paths
  - requestBody
  - responses
  - parameters (path + query)
  - schemas
  - components

- It must properly generate:
  - TypeScript interfaces for request bodies (only when requestBody exists)
  - TypeScript types for response bodies (always, default to `any` if no schema)
  - Client wrapper functions using BaseClient
  - Endpoint constants

- It must handle:
  - optional request bodies
  - optional query parameters
  - multiple response status codes
  - nullable fields
  - enums
  - nested schemas
  - array types
  - references ($ref)
  - DELETE requests with body (all HTTP methods can have bodies)

- The generator must avoid duplicate type generation.
- It must resolve $ref correctly from components/schemas.
- Only import request types in client files when they actually exist.

---

## BASE API CLIENT REQUIREMENTS

The BaseAPIClient must:

1. Support all HTTP methods: GET, POST, PUT, PATCH, DELETE
2. All methods that can have a body (POST, PUT, PATCH, DELETE) must accept an optional `data` parameter
3. Implement logging:
   - Endpoint: log at INFO level (`>>> METHOD baseURL/endpoint`)
   - Headers: log at DEBUG level (merged default + request headers)
   - Request Body: log at INFO level (for methods with body)
   - Response: log at INFO level (status code and response body)

Method signatures:

```typescript
get<T>(endpoint: string, options?: RequestOptions): Promise<APIResponseResult<T>>
post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponseResult<T>>
put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponseResult<T>>
patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponseResult<T>>
delete<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponseResult<T>>
```

---

## OUTPUT FORMAT

Generate:

1. The generator utility code
2. Example generated output for at least 3 endpoints
3. Folder structure preview
4. Clear explanation comments inside the code

The solution must be clean, modular, maintainable, and scalable for enterprise usage.
