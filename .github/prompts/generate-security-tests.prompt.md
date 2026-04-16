# Generate Security Tests

## Trigger

```
#generate-security-tests #file:tests/[ClientClass]/test-cases/[filename]
```

Read the test-cases file passed via `#file:`.
Do NOT generate functional tests -- only security.
Do NOT generate tests from a JIRA ticket directly -- use `#generate-test-cases` first.

---

## Step 1 -- Read the header block

Extract these values from the file header -- do not re-derive them:

| Header field   | Use                         |
| -------------- | --------------------------- |
| CLIENT METHOD  | client method call in tests |
| CLIENT CLASS   | test.describe() label       |
| SECURITY FILES | write output to these paths |

---

## Step 2 -- Resolve fixture names

Open `src/fixtures/api.fixture.ts`.
Find the fixture whose type matches CLIENT CLASS → that is [CLIENT_FIXTURE].

Derive security variants from [CLIENT_FIXTURE]:
anon[PascalFixture] → TC-S01 (no auth)
invalidToken[PascalFixture] → TC-S02 (invalid token)
malformedToken[PascalFixture] → TC-S03 (malformed scheme)
noneAlg[PascalFixture] → TC-S04 (JWT alg:none)
otherUser[PascalFixture] → TC-S06 (IDOR)

Example: CLIENT CLASS = SignupClient → signupClient, anonSignupClient, etc.
NEVER hardcode activityClient unless CLIENT CLASS is ActivityClient.

If any required security variant is missing from api.fixture.ts,
add it following the existing pattern BEFORE generating tests.

---

## Step 3 -- Generate security tests

Implement ONLY TCs from the `SECURITY TEST CASES` section.
Each TC-S\* = exactly one test() block.
TC description → test name: `should [TC description]`.
Never add, remove, or combine test cases.

TC groups map to files:

| TC groups                                                           | File                           |
| ------------------------------------------------------------------- | ------------------------------ |
| [AUTHENTICATION] + [OBJECT LEVEL AUTHORIZATION] + [MASS ASSIGNMENT] | auth.security.spec.ts          |
| [INJECTION]                                                         | injection.security.spec.ts     |
| [RESPONSE HEADERS]                                                  | headers.security.spec.ts       |
| [DATA EXPOSURE]                                                     | data-exposure.security.spec.ts |

---

## Imports (same for all four files)

```typescript
import { test, expect } from '../../../src/fixtures/api.fixture';
import { ApiAssertions } from '../../../src/utils/ApiAssertions';
import { SecurityPayloads } from '../../../src/utils/SecurityPayloads';
import { TestDataGenerator } from '../../../src/utils/TestDataGenerator';
import { SetupHelpers } from '../../../src/helpers/SetupHelpers';
import { STATUS } from '../../../src/helpers/ApiStatusCodes';
```

Never import CleanupManager -- use the `cleanup` fixture.
Never import from `@playwright/test`.

---

## Implementation patterns

Read `.github/skills/security.skill.md` for TC implementation recipes:
AUTHENTICATION, IDOR, INJECTION, MASS ASSIGNMENT, RESPONSE HEADERS, DATA EXPOSURE.
