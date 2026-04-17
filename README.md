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

## Wrting Tests with Generated Clients

The generator produces typed fixture clients, assertion helpers, test data utilities,
and status-code constants so tests stay concise and consistent.

```typescript
// Import test & expect from the generated fixtures — NOT from @playwright/test
import { test, expect } from '../src/fixtures/fixtures';
import { ApiAssertions } from '../src/utils/ApiAssertions';
import { STATUS } from '../src/helpers/ApiStatusCodes';
import { random } from '../src/utils/TestDataGenerator';

test('get all pets', async ({ petClient }) => {
	const { body, status } = await petClient.findPetsByStatus('available');

	ApiAssertions.expectStatus(status, STATUS.OK);
	expect(body?.length).toBeGreaterThan(0);
});

test('create and delete a pet', async ({ petClient, cleanup }) => {
	const payload = { name: random.fullName(), status: 'available' };

	const { body, status } = await petClient.addPet(payload);

	// Register cleanup BEFORE asserting so teardown runs even on failure
	cleanup.register(async () => {
		await petClient.deletePet(body?.id);
	});

	ApiAssertions.expectStatus(status, STATUS.OK);
	expect(body?.name).toBe(payload.name);
});
```

### With Request/Response Logging

```typescript
import { configureLogger, getLogger } from 'swagger-to-playwright-api-clients';

// Configure logger (optional — reads generator-config.ts by default)
configureLogger({
	level: 'debug',
	console: true,
	file: false,
});
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
src/
├── clients/
│   ├── BaseAPIClient.ts              # Base client (auto-copied)
│   └── generatedClients/
│       └── MyService/
│           ├── Activity/
│           │   ├── types.ts
│           │   └── MyServiceActivityClient.ts
│           ├── Users/
│           │   ├── types.ts
│           │   └── MyServiceUsersClient.ts
│           └── Root/
│               ├── types.ts
│               └── MyServiceRootClient.ts
├── fixtures/
│   └── fixtures.ts                   # Playwright fixtures with typed clients
├── helpers/
│   ├── ApiStatusCodes.ts             # Named HTTP status constants
│   └── SetupHelpers.ts              # Precondition / teardown helpers
└── utils/
    ├── ApiAssertions.ts              # Typed assertion helpers
    ├── SecurityPayloads.ts           # Security test payloads
    ├── TestDataGenerator.ts          # Random test data builders
    └── TypeValidator.ts              # Runtime type validation
```

## Peer Dependencies

This library requires Playwright to be installed in your project:

```bash
npm install @playwright/test playwright
```

## License

MIT
