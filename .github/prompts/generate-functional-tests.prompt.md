# Generate Functional Tests

## Trigger

```
#generate-functional-tests #file:tests/[ClientClass]/test-cases/[filename]
```

Read the test-cases file passed via `#file:`.
Do NOT generate security tests -- only functional.
Do NOT generate tests from a JIRA ticket directly -- use `#generate-test-cases` first.

---

## Step 1 -- Read the header block

Extract these values from the file header -- do not re-derive them:

| Header field    | Use                                 |
| --------------- | ----------------------------------- |
| CLIENT METHOD   | client method call in tests         |
| CLIENT CLASS    | test.describe() label               |
| REQUEST TYPE    | import from TYPES PATH              |
| RESPONSE TYPE   | import from TYPES PATH              |
| RESPONSE FIELDS | exact field names for TypeValidator |
| TYPES PATH      | import path                         |
| TEST FILE       | write output to this path           |

---

## Step 2 -- Resolve fixture name

Open `src/fixtures/api.fixture.ts`.
Find the fixture whose type matches CLIENT CLASS.
That fixture name is [CLIENT_FIXTURE] for all test code below.
Example: CLIENT CLASS = SignupClient → [CLIENT_FIXTURE] = signupClient.
NEVER hardcode activityClient unless CLIENT CLASS is ActivityClient.

---

## Step 3 -- Generate functional tests

Implement ONLY TCs from the `FUNCTIONAL TEST CASES` section.
Each TC-F\* = exactly one test() block.
TC description → test name: `should [TC description]`.
Never add, remove, or combine test cases.

TC groups map to test.describe() blocks:

| TC group            | describe name         |
| ------------------- | --------------------- |
| [TYPE SHAPE]        | Type Shape Validation |
| [CRUD LIFECYCLE]    | CRUD Lifecycle        |
| [BUSINESS RULES]    | Business Rules        |
| [STATE PERSISTENCE] | State Persistence     |
| [IDEMPOTENCY]       | Idempotency           |
| [EDGE CASES]        | Edge Cases            |

Skip a group only if the test-cases file has no TCs in that group.

---

## Imports

```typescript
import { test, expect } from '../../../src/fixtures/api.fixture';
import { TestDataGenerator } from '../../../src/utils/TestDataGenerator';
import { ApiAssertions } from '../../../src/utils/ApiAssertions';
import { TypeValidator } from '../../../src/utils/TypeValidator';
import { SetupHelpers } from '../../../src/helpers/SetupHelpers';
import { STATUS } from '../../../src/helpers/ApiStatusCodes';
import type { [REQUEST TYPE], [RESPONSE TYPE] } from '[TYPES PATH]';
```

Never import CleanupManager -- use the `cleanup` fixture.
Never import from `@playwright/test`.

---

## File skeleton

```typescript
test.describe("[CLIENT CLASS] -- Functional Tests", () => {
  test.describe("[TC group name]", () => {
    test("should [TC description]", async ({ [CLIENT_FIXTURE], cleanup }) => {
      const payload = TestDataGenerator.[resource].build();
      const { body, status, headers } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
      cleanup.register(() =>
        SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!)
      ); // register BEFORE asserting
      ApiAssertions.expectOneOf(status, [STATUS.OK, STATUS.CREATED]);
    });
  });
});
```

---

## Implementation patterns

Read `.github/skills/functional.skill.md` for TC implementation recipes:
TYPE SHAPE, CRUD LIFECYCLE, BUSINESS RULES, STATE PERSISTENCE, IDEMPOTENCY, EDGE CASES.

---

## Functional Test Checklist

Before finishing, verify the generated file covers:

- [ ] Type shape validation for every 2xx response field (use `TypeValidator`)
- [ ] Nested objects validated (`completionData`, `energiser`, `name` translations)
- [ ] `reminders` validated as `T[] | null | undefined` with `expectNullableArray`
- [ ] `repeatingDays` validated as `number[]` with `expectOptionalNumberArray`
- [ ] `dueOn`, `createdAt`, `updatedAt` validated as ISO dates with `expectOptionalISODate`
- [ ] Full CRUD lifecycle in one ordered test (if mutations exist)
- [ ] Every JIRA acceptance criterion has at least one test
- [ ] State persistence — update then re-fetch confirms change
- [ ] Idempotent GET — same body on two calls
- [ ] Idempotent DELETE — 4xx on second call
- [ ] No 5xx on any valid input
- [ ] Cleanup registered BEFORE every assertion
- [ ] No inline raw payloads — all via `TestDataGenerator`
- [ ] No raw `expect(status).toBe(...)` — all via `ApiAssertions`
