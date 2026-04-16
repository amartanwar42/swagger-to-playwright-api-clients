# API Automation Framework — Master Skill

## Framework Stack

```
swagger-to-playwright-api-clients   ← Generates typed clients + types.ts from OpenAPI/Swagger
@playwright/test                    ← Test runner (APIRequestContext used internally by BaseAPIClient)
@faker-js/faker                     ← Random test data generation
dotenv                              ← Environment variables
```

---

## Critical: Exact Library Contracts

### `APIResponseResult<T>` — the return shape of EVERY method

```typescript
export interface APIResponseResult<T = unknown> {
  body: T; // typed as the generated Response interface — already parsed
  status: number; // NUMBER (e.g. 200, 404)
  headers: Record<string, string>; // all response headers, lowercase keys
}
```

- `status` is `number` — always compare with numbers
- `body` is already typed — no casting needed
- `headers` keys are lowercase
- On error responses, `body` may be an error shape — check `status` first

### BaseAPIClient lifecycle

```typescript
const baseClient = new BaseAPIClient(process.env.BASE_URL!, headers);
await baseClient.init();
const client = new SignupClient(baseClient);
await baseClient.dispose();
```

**Never call `init()` or `dispose()` in test files.** The fixture handles the full lifecycle.

### Generated type naming convention

```
GET  /api/v1/signup/patient  → getSignupPatientResponse
POST /api/v1/signup/patient  → postSignupPatientRequest / postSignupPatientResponse
```

### Generated file structure

```
src/clients/generatedClients/<ServiceName>/<TagName>/
  ├── types.ts                          ← all interfaces for this tag
  └── <ServiceName><TagName>Client.ts   ← the client class
```

### All fields are optional — defensive access required

```typescript
// ✅ Always use optional chaining
body.user?._id;
body.onboardingSteps?.[0]?.name;

// ❌ Unsafe
body.user._id;
```

---

## Pre-Generated Utilities — ALWAYS USE, NEVER REWRITE

| File                             | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `src/fixtures/api.fixture.ts`    | All clients + auth variants — lifecycle handled          |
| `src/fixtures/ClientFactory.ts`  | On-demand client creation for integration tests          |
| `src/utils/TestDataGenerator.ts` | Payload builders matching generated Request interfaces   |
| `src/utils/ApiAssertions.ts`     | Typed helpers for `{ body, status, headers }`            |
| `src/utils/CleanupManager.ts`    | Registers and runs teardown — used via `cleanup` fixture |
| `src/utils/TypeValidator.ts`     | Runtime structural checks on body fields                 |
| `src/utils/SecurityPayloads.ts`  | SQL, XSS, SSTI, path traversal, JWT payloads             |
| `src/utils/AuthHelper.ts`        | Token fetching with caching                              |
| `src/utils/ResponseLogger.ts`    | Debug logging for responses                              |
| `src/helpers/SetupHelpers.ts`    | Precondition helpers (create/delete resources)           |
| `src/helpers/ApiStatusCodes.ts`  | Named HTTP status number constants                       |

---

## Golden Rules

1. Import `test` and `expect` from `src/fixtures/api.fixture` — never from `@playwright/test`
2. `status` is a `number` — use `ApiAssertions.*`, never raw `expect(status).toBe(...)`
3. Use optional chaining on all `body` access
4. Use `TestDataGenerator.*` for all request payloads — never inline raw objects
5. Register cleanup BEFORE asserting — teardown must run even if assertions throw
6. Use `cleanup` fixture — never import `CleanupManager` directly
7. Never use `test.beforeEach` or `test.afterEach` — fixture owns lifecycle
8. Use `SetupHelpers.*` for preconditions — never repeat create/delete logic
9. Never call `baseClient.init()` / `dispose()` in tests
10. Never use `console.*` — use `import { logger } from 'swagger-to-playwright-api-clients'`
11. Fixture client name must match CLIENT CLASS — never hardcode `activityClient`

---

## Fixture Client Naming

Derive from CLIENT CLASS. Read `api.fixture.ts` to confirm.

| Variant          | Pattern                     | Example (SignupClient)     |
| ---------------- | --------------------------- | -------------------------- |
| Authenticated    | camelCase(CLASS)            | signupClient               |
| No auth          | anon + PascalCase           | anonSignupClient           |
| Invalid token    | invalidToken + PascalCase   | invalidTokenSignupClient   |
| Malformed scheme | malformedToken + PascalCase | malformedTokenSignupClient |
| JWT alg:none     | noneAlg + PascalCase        | noneAlgSignupClient        |
| Other user       | otherUser + PascalCase      | otherUserSignupClient      |

---

## Logger

```typescript
// ✅ All framework files use the shared logger
import { logger } from 'swagger-to-playwright-api-clients';

// ❌ Never use console
console.log(...)
```

|------|-------------|
| `BaseAPIClient.ts` | `init`, `dispose`, every `>>>` request and `<<<` response (built-in) |
| `AuthHelper.ts` | Token cache hits, login success, login failures, missing env vars |
| `CleanupManager.ts` | Count and reason of any failed cleanup tasks |
| `SetupHelpers.ts` | Unexpected status codes on delete, caught errors |
| `ResponseLogger.ts` | Request label, status, content-type, and body preview on every wrapped call |

**Tests never call `logger` directly** — that is framework infrastructure only.
