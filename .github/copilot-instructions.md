# Copilot Instructions

This repo uses `swagger-to-playwright-api-clients` to auto-generate typed API clients from Swagger specs.

---

## Three-Step Workflow -- ALWAYS Follow This

NEVER generate test code unless the user explicitly runs `#generate-functional-tests` or `#generate-security-tests`.

Step 1: `#generate-test-cases` [JIRA ticket or endpoint]
→ Outputs test case definitions to tests/[ClientClass]/test-cases/ -- NO code

Step 2: User reviews and edits the test cases file

Step 3a: `#generate-functional-tests` #file:tests/[ClientClass]/test-cases/[filename]
→ Generates functional test code from approved TCs

Step 3b: `#generate-security-tests` #file:tests/[ClientClass]/test-cases/[filename]
→ Generates security test code from approved TCs

---

## Hard Rules -- Apply to Every File You Write

- `status` is a NUMBER: `200`, `404` -- never a string `'200'`
- Always use optional chaining on body: `body.field?.[0]?.nested`
- `headers` keys are always lowercase: `headers['content-type']`
- Never import from `@playwright/test` -- always from `src/fixtures/api.fixture`
- Never use `console.*` -- use `import { logger } from 'swagger-to-playwright-api-clients'`
- Never call `baseClient.init()` or `baseClient.dispose()` in tests
- Never inline raw request objects -- always use `TestDataGenerator.*`
- Never write raw `expect(status).toBe(...)` -- always use `ApiAssertions.*`
- Register cleanup BEFORE asserting -- teardown must run even if assertions throw
- Never import `CleanupManager` -- use the `cleanup` fixture
- Never use `test.beforeEach` or `test.afterEach` -- fixture owns lifecycle

---

## Fixture Client Naming -- CRITICAL

Always derive fixture names from CLIENT CLASS in the test-cases file header.
Read `src/fixtures/api.fixture.ts` to confirm the exact fixture name.
NEVER hardcode `activityClient` unless CLIENT CLASS is actually ActivityClient.

Pattern (example for SignupClient → signupClient):
Authenticated: signupClient
No auth: anonSignupClient
Invalid token: invalidTokenSignupClient
Malformed scheme: malformedTokenSignupClient
JWT alg:none: noneAlgSignupClient
Other user (IDOR): otherUserSignupClient

If a required security variant is missing from `api.fixture.ts`, add it following the existing pattern before generating tests.

---

## Client Pattern -- Two Types

### Functional and security tests -- use pre-declared fixture clients

```typescript
test('...', async ({ signupClient, cleanup }) => { ... });
test('...', async ({ anonSignupClient }) => { ... }); // security
```

### Integration tests -- use ClientFactory service object

```typescript
import { ClientFactory } from '../../src/fixtures/ClientFactory';

test('...', async ({ cleanup }) => {
  const factory = new ClientFactory('user');
  const signupClient = await factory.create(SignupClient);
  try {
    // test body
  } finally {
    await factory.disposeAll();
  }
});
```

Never create a new fixture file for integration tests.
Never add new clients to api.fixture.ts for integration tests.

---

## File Locations

| What              | Where                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| Generated clients | `src/clients/generatedClients/<Service>/<Tag>/<Service><Tag>Client.ts` |
| Generated types   | `src/clients/generatedClients/<Service>/<Tag>/types.ts`                |
| Fixture           | `src/fixtures/api.fixture.ts`                                          |
| ClientFactory     | `src/fixtures/ClientFactory.ts`                                        |
| Utilities         | `src/utils/`                                                           |
| Helpers           | `src/helpers/`                                                         |
| Functional tests  | `tests/[ClientClass]/functional/`                                      |
| Security tests    | `tests/[ClientClass]/security/`                                        |
| Integration tests | `tests/[ClientClass]/integration/`                                     |
| Test cases        | `tests/[ClientClass]/test-cases/`                                      |
