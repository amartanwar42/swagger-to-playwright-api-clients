# swagger-to-playwright-api-clients

Generate TypeScript API clients from Swagger/OpenAPI specifications for Playwright testing.

## Installation

```bash
npm install swagger-to-playwright-api-clients
```

## Quick Start

### 1. Initialize Configuration

```bash
npx swagger-to-playwright init
```

This creates a `generator-config.ts` file in your project root.

### 2. Configure Your Sources

Edit `generator-config.ts`:

```typescript
import type { AutomationConfig } from 'swagger-to-playwright-api-clients';
import * as path from 'path';

const config: AutomationConfig = {
	// Output directory for generated clients
	outputDir: path.join(__dirname, 'src/clients'),

	// Clean output before generation
	cleanOutput: true,

	// Process sources in parallel
	parallel: false,

	// BaseAPIClient import path (optional - defaults to '../../../BaseAPIClient')
	// Generated clients are at: outputDir/generatedClients/ServiceName/FolderName/
	// The library will auto-copy BaseAPIClient.ts to your outputDir
	// baseClientPath: '../../../BaseAPIClient',

	// Swagger/OpenAPI sources
	sources: [
		{
			type: 'file',
			source: './swagger/api.json',
			serviceName: 'MyService',
		},
		{
			type: 'url',
			source: 'https://api.example.com/swagger.json',
			serviceName: 'ExampleService',
		},
	],
};

export default config;
```

### 3. Generate Clients

```bash
npx swagger-to-playwright
```

## CLI Usage

```bash
# Generate from config file
npx swagger-to-playwright

# Generate from specific config
npx swagger-to-playwright --config ./my-config.ts

# Generate from single file
npx swagger-to-playwright --file ./swagger.json --output ./src/clients

# Generate from URL
npx swagger-to-playwright --url https://api.example.com/swagger.json --output ./src/clients

# Show help
npx swagger-to-playwright --help

# Initialize a new config file
npx swagger-to-playwright init
```

## Programmatic Usage

```typescript
import { generate, generateFromConfig } from 'swagger-to-playwright-api-clients';

// Generate from a single source
const result = await generate({
	source: './swagger.json',
	type: 'file',
	outputDir: './src/clients',
	serviceName: 'MyService',
});

// Generate from config object
const results = await generateFromConfig({
	outputDir: './src/clients',
	sources: [{ type: 'file', source: './swagger.json', serviceName: 'MyService' }],
});
```

## Using Generated Clients

```typescript
import { test, expect } from '@playwright/test';
import { BaseAPIClient } from './clients/BaseAPIClient';
import { MyServiceActivityClient } from './clients/generatedClients/MyService/Activity/MyServiceActivityClient';

test('API test example', async () => {
	const baseClient = new BaseAPIClient('https://api.example.com', {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-token',
	});
	await baseClient.init();

	const activityClient = new MyServiceActivityClient(baseClient);

	const { body, status } = await activityClient.getActivities();

	expect(status).toBe(200);
	expect(body.activities).toBeDefined();

	await baseClient.dispose();
});
```

### With Request/Response Logging

```typescript
import { getLogger, configureLogger } from 'swagger-to-playwright-api-clients';
import { BaseAPIClient } from './clients/BaseAPIClient';

// Configure logger (optional - uses defaults if not called)
configureLogger({
	level: 'debug',
	console: true,
	file: false,
});

// Pass logger to BaseAPIClient for request/response logging
const baseClient = new BaseAPIClient(
	'https://api.example.com',
	{ 'Content-Type': 'application/json' },
	getLogger() // Winston logger instance
);
```

## Configuration Options

| Option           | Type                  | Default                    | Description                          |
| ---------------- | --------------------- | -------------------------- | ------------------------------------ |
| `outputDir`      | string                | required                   | Output directory for generated files |
| `sources`        | SwaggerSourceConfig[] | required                   | Array of swagger sources             |
| `baseClientPath` | string                | `'../../../BaseAPIClient'` | Custom path to BaseAPIClient         |
| `copyBaseClient` | boolean               | `true`                     | Copy BaseAPIClient to output         |
| `cleanOutput`    | boolean               | `true`                     | Clean output before generation       |
| `parallel`       | boolean               | `false`                    | Process sources in parallel          |
| `logger`         | LoggerConfig          | see below                  | Logger configuration                 |

### Logger Configuration

Configure logging for the generation process:

```typescript
const config: AutomationConfig = {
	// ... other options
	logger: {
		level: 'info', // 'error' | 'warn' | 'info' | 'debug' | 'verbose'
		outputDir: './logs', // Log file output directory
		console: true, // Print logs to console
		file: true, // Write logs to file
	},
};
```

## Generated Structure

```
src/clients/
├── BaseAPIClient.ts           # Base client (auto-copied)
└── generatedClients/
    └── MyService/
        ├── Activity/
        │   ├── types.ts
        │   └── MyServiceActivityClient.ts
        ├── Users/
        │   ├── types.ts
        │   └── MyServiceUsersClient.ts
        └── Root/
            ├── types.ts
            └── MyServiceRootClient.ts
```

## Peer Dependencies

This library requires Playwright to be installed in your project:

```bash
npm install @playwright/test playwright
```

## License

MIT
