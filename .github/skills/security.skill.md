# Security Test Skill

> Read `.github/skills/master.skill.md` first for framework contracts and golden rules.

---

## What Security Tests Cover (OWASP API Security Top 10)

| OWASP   | Category                          | What We Test                                             |
| ------- | --------------------------------- | -------------------------------------------------------- |
| API1    | Broken Object Level Authorization | IDOR — user accesses another user's resource             |
| API2    | Broken Authentication             | No token → 401, invalid token → 401, alg:none → 401      |
| API3    | Excessive Data Exposure           | No secrets/stack traces/internal paths in body           |
| API6    | Mass Assignment                   | Extra fields in request body are ignored                 |
| API8    | Injection                         | SQL, XSS, SSTI payloads → no 5xx, no leak in body        |
| Headers | Misconfiguration                  | x-content-type-options, x-frame-options, no x-powered-by |

---

## File Convention

```
tests/[ClientClass]/security/
├── auth.security.spec.ts          ← Authentication + IDOR + Mass Assignment
├── injection.security.spec.ts     ← SQL, XSS, SSTI
├── headers.security.spec.ts       ← Response header checks
└── data-exposure.security.spec.ts ← Stack traces, internal paths, sensitive data
```

---

## Imports

```typescript
import { test, expect } from '../../../src/fixtures/api.fixture';
import { ApiAssertions } from '../../../src/utils/ApiAssertions';
import { SecurityPayloads } from '../../../src/utils/SecurityPayloads';
import { TestDataGenerator } from '../../../src/utils/TestDataGenerator';
import { SetupHelpers } from '../../../src/helpers/SetupHelpers';
import { STATUS } from '../../../src/helpers/ApiStatusCodes';
```

Never import CleanupManager — use the `cleanup` fixture.
Never import from `@playwright/test`.
Never use `test.beforeEach` or `test.afterEach`.

---

## Fixture Client Naming for Security Tests

Derive all fixture names from CLIENT CLASS. Read `api.fixture.ts` to confirm.

| TC                      | Fixture pattern               | Example (SignupClient)     |
| ----------------------- | ----------------------------- | -------------------------- |
| TC-S01 No auth          | anon[PascalFixture]           | anonSignupClient           |
| TC-S02 Invalid token    | invalidToken[PascalFixture]   | invalidTokenSignupClient   |
| TC-S03 Malformed scheme | malformedToken[PascalFixture] | malformedTokenSignupClient |
| TC-S04 JWT alg:none     | noneAlg[PascalFixture]        | noneAlgSignupClient        |
| TC-S05 Sensitive data   | [CLIENT_FIXTURE]              | signupClient               |
| TC-S06 IDOR             | otherUser[PascalFixture]      | otherUserSignupClient      |

If a required variant is missing from `api.fixture.ts`, add it following the existing pattern.

---

## TC Implementation Patterns

Replace placeholders when generating code:

- `[CLIENT_FIXTURE]` = camelCase fixture from api.fixture.ts (e.g. signupClient)
- `[CLIENT METHOD]` = exact method from test-cases header
- `[resource]` = TestDataGenerator namespace (e.g. signup)

### AUTHENTICATION (TC-S01 through TC-S04)

```typescript
test('should return 401 or 403 when no auth token', async ({ anon[PascalFixture] }) => {
  const payload = TestDataGenerator.[resource].build();
  const { status } = await anon[PascalFixture].[CLIENT METHOD](payload);
  ApiAssertions.expectOneOf(status, [STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]);
});
```

### SENSITIVE DATA IN RESPONSE (TC-S05)

```typescript
test('should not contain token, password, or secret in body', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const payload = TestDataGenerator.[resource].build();
  const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  if (ApiAssertions.isSuccess(status)) {
    cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
  }
  expect(JSON.stringify(body)).not.toMatch(/token|password|secret/i);
});
```

### IDOR (TC-S06)

```typescript
test('should prevent other user from accessing resource', async ({ [CLIENT_FIXTURE], otherUser[PascalFixture], cleanup }) => {
  const payload = TestDataGenerator.[resource].build();
  const { body } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
  const { status } = await otherUser[PascalFixture].[CLIENT METHOD](payload);
  ApiAssertions.expectOneOf(status, [STATUS.FORBIDDEN, STATUS.NOT_FOUND]);
});
```

### INJECTION (TC-S07, TC-S08, TC-S09)

Use for-loop, one test per payload:

```typescript
// SQL Injection
for (const p of SecurityPayloads.sqlInjection) {
  test(`should not 5xx for SQL: ${p.slice(0, 40)}`, async ({ [CLIENT_FIXTURE], cleanup }) => {
    const payload = TestDataGenerator.[resource].build({ [stringField]: p });
    const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
    ApiAssertions.expectNoServerError(status);
    ApiAssertions.expectNoDatabaseErrorsInBody(body);
    if (ApiAssertions.isSuccess(status)) {
      cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
    }
  });
}

// XSS
for (const p of SecurityPayloads.xss) {
  test(`should not reflect XSS: ${p.slice(0, 40)}`, async ({ [CLIENT_FIXTURE], cleanup }) => {
    const payload = TestDataGenerator.[resource].build({ [stringField]: p });
    const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
    ApiAssertions.expectNoServerError(status);
    expect(JSON.stringify(body)).not.toMatch(/<script.*?>/i);
    if (ApiAssertions.isSuccess(status)) {
      cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
    }
  });
}

// SSTI
for (const p of SecurityPayloads.ssti) {
  test(`should not evaluate SSTI: ${p.slice(0, 40)}`, async ({ [CLIENT_FIXTURE], cleanup }) => {
    const payload = TestDataGenerator.[resource].build({ [stringField]: p });
    const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
    ApiAssertions.expectNoServerError(status);
    expect(JSON.stringify(body)).not.toContain(p);
    if (ApiAssertions.isSuccess(status)) {
      cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
    }
  });
}
```

### MASS ASSIGNMENT (TC-S10)

```typescript
test('should ignore extra privileged fields', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const payload = { ...TestDataGenerator.[resource].build(), isAdmin: true, role: 'superuser' };
  const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload as any);
  if (ApiAssertions.isSuccess(status)) {
    cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
  }
  expect(JSON.stringify(body)).not.toContain('superuser');
  expect(JSON.stringify(body)).not.toContain('isAdmin');
});
```

### RESPONSE HEADERS (TC-S11 through TC-S15)

```typescript
// Make one request, assert each header in its own test:
test('should have x-content-type-options: nosniff', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const payload = TestDataGenerator.[resource].build();
  const { body, status, headers } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  if (ApiAssertions.isSuccess(status)) {
    cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
  }
  ApiAssertions.expectHeader(headers, 'x-content-type-options', 'nosniff');
});
```

Available header assertions:

- `ApiAssertions.expectHeader(headers, 'key', 'value')`
- `ApiAssertions.expectHeaderMatches(headers, 'x-frame-options', /DENY|SAMEORIGIN/i)`
- `ApiAssertions.expectHeaderAbsent(headers, 'x-powered-by')`
- `ApiAssertions.expectServerHeaderNotVersioned(headers)`
- `ApiAssertions.expectJsonContentType(headers)`
- `ApiAssertions.expectHeaderContains(headers, 'strict-transport-security', 'max-age=')`

### DATA EXPOSURE (TC-S16 through TC-S18)

```typescript
test('should not expose stack trace', async ({ [CLIENT_FIXTURE] }) => {
  const payload = TestDataGenerator.[resource].build({ [field]: 'invalid_value' });
  const { body } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  ApiAssertions.expectNoStackTraceInBody(body);
});

test('should not expose internal paths', async ({ [CLIENT_FIXTURE] }) => {
  const payload = TestDataGenerator.[resource].build({ [field]: 'invalid_value' });
  const { body } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  ApiAssertions.expectNoInternalPathsInBody(body);
});

test('should not expose sensitive fields', async ({ [CLIENT_FIXTURE] }) => {
  const payload = TestDataGenerator.[resource].build();
  const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  if (ApiAssertions.isSuccess(status)) {
    ApiAssertions.expectNoSensitiveDataInBody(body);
  }
});
```

// ── SQL Injection ─────────────────────────────────────────────────────────

test.describe('SQL Injection Prevention', () => {

    for (const sqlPayload of SecurityPayloads.sqlInjection) {
      test(`should not 5xx or leak DB errors for SQL payload: ${sqlPayload.slice(0, 35)}`,
        async ({ activityClient }) => {
          const payload = TestDataGenerator.activitySchedule.build({
            activityPlanId: sqlPayload,
          });
          const { body, status } = await activityClient.postActivityActivityPlanSchedule(payload);

          // MUST never be 5xx — that signals injection or uncaught DB error
          ApiAssertions.expectNoServerError(status);
          ApiAssertions.expectNoDatabaseErrorsInBody(body);

          if (status === STATUS.OK || status === STATUS.CREATED) {
            cleanup.register(() =>
              SetupHelpers.deleteActivitySchedule(activityClient, body.activityPlanScheduleId!)
            );
          }
        }
      );
    }

    test('should not expose DB error strings in 4xx error response body',
      async ({ activityClient }) => {
        // Send SQL injection as query param
        const { body, status } = await activityClient.getActivityActivityPlanSchedule({
          currentPatientId: "' OR '1'='1",
        });

        ApiAssertions.expectNoServerError(status);
        ApiAssertions.expectNoDatabaseErrorsInBody(body);
      }
    );

});

// ── XSS Prevention ────────────────────────────────────────────────────────

test.describe('XSS Prevention', () => {

    for (const xssPayload of SecurityPayloads.xss) {
      test(`should not reflect XSS payload unescaped: ${xssPayload.slice(0, 35)}`,
        async ({ activityClient }) => {
          const payload = TestDataGenerator.activitySchedule.build({
            activityPlanId: xssPayload,
          });
          const { body, status } = await activityClient.postActivityActivityPlanSchedule(payload);

          ApiAssertions.expectNoServerError(status);

          if (status === STATUS.OK || status === STATUS.CREATED) {
            cleanup.register(() =>
              SetupHelpers.deleteActivitySchedule(activityClient, body.activityPlanScheduleId!)
            );
            ApiAssertions.expectNoUnescapedScriptTagsInBody(body);
          }
        }
      );
    }

});

// ── SSTI Prevention ───────────────────────────────────────────────────────

test.describe('Server-Side Template Injection Prevention', () => {

    for (const sstiPayload of SecurityPayloads.ssti) {
      test(`should not evaluate template expression: ${sstiPayload}`,
        async ({ activityClient }) => {
          const payload = TestDataGenerator.activitySchedule.build({
            activityPlanId: sstiPayload,
          });
          const { body, status } = await activityClient.postActivityActivityPlanSchedule(payload);

          ApiAssertions.expectNoServerError(status);

          if (status === STATUS.OK || status === STATUS.CREATED) {
            cleanup.register(() =>
              SetupHelpers.deleteActivitySchedule(activityClient, body.activityPlanScheduleId!)
            );
            // If {{7*7}} was evaluated to 49, that is SSTI
            const bodyStr = JSON.stringify(body);
            expect(bodyStr).not.toContain('"49"');
            expect(bodyStr).not.toContain(':49');
          }
        }
      );
    }

});

});

````

---

## Security Headers Tests

```typescript
// tests/security/headers.security.spec.ts
import { test }          from '../../src/fixtures/api.fixture';
import { ApiAssertions } from '../../src/utils/ApiAssertions';
import { STATUS }        from '../../src/helpers/ApiStatusCodes';

test.describe('Security Response Headers', () => {

  test('should include x-content-type-options: nosniff',
    async ({ activityClient }) => {
      const { headers } = await activityClient.getActivityActivityPlanSchedule();
      ApiAssertions.expectHeader(headers, 'x-content-type-options', 'nosniff');
    }
  );

  test('should include x-frame-options header',
    async ({ activityClient }) => {
      const { headers } = await activityClient.getActivityActivityPlanSchedule();
      ApiAssertions.expectHeaderMatches(headers, 'x-frame-options', /DENY|SAMEORIGIN/i);
    }
  );

  test('should NOT expose x-powered-by header',
    async ({ activityClient }) => {
      const { headers } = await activityClient.getActivityActivityPlanSchedule();
      ApiAssertions.expectHeaderAbsent(headers, 'x-powered-by');
    }
  );

  test('should NOT expose server version in server header',
    async ({ activityClient }) => {
      const { headers } = await activityClient.getActivityActivityPlanSchedule();
      ApiAssertions.expectServerHeaderNotVersioned(headers);
    }
  );

  test('should return content-type application/json',
    async ({ activityClient }) => {
      const { headers } = await activityClient.getActivityActivityPlanSchedule();
      ApiAssertions.expectJsonContentType(headers);
    }
  );

  test('should include HSTS header on HTTPS endpoints',
    async ({ activityClient }) => {
      if (!process.env.BASE_URL?.startsWith('https')) {
        test.skip(true, 'HSTS only applies to HTTPS');
      }
      const { headers } = await activityClient.getActivityActivityPlanSchedule();
      ApiAssertions.expectHeaderContains(headers, 'strict-transport-security', 'max-age=');
    }
  );

});
````

---

## Data Exposure Tests

```typescript
// tests/security/data-exposure.security.spec.ts
import { test } from '../../src/fixtures/api.fixture';
import { ApiAssertions } from '../../src/utils/ApiAssertions';
import { STATUS } from '../../src/helpers/ApiStatusCodes';

test.describe('Sensitive Data Exposure (API3)', () => {
  test('should not expose stack traces in error response body', async ({ activityClient }) => {
    // Intentionally bad param to trigger an error
    const { body, status } = await activityClient.getActivityActivityPlanScheduleById(
      'invalid-id-to-trigger-error'
    );
    ApiAssertions.expectNoServerError(status);
    ApiAssertions.expectNoStackTraceInBody(body);
  });

  test('should not expose internal file paths in error response body', async ({
    activityClient,
  }) => {
    const { body } = await activityClient.getActivityActivityPlanScheduleById(
      'invalid-id-to-trigger-error'
    );
    ApiAssertions.expectNoInternalPathsInBody(body);
  });

  test('should not include sensitive fields in list response body', async ({ activityClient }) => {
    const { body, status } = await activityClient.getActivityActivityPlanSchedule();
    ApiAssertions.expectStatus(status, STATUS.OK);
    ApiAssertions.expectNoSensitiveDataInBody(body);
  });
});
```

---

## Security Test Checklist

For each protected API resource:

- [ ] **API1** — Unauthenticated `anonClient` → 401/403
- [ ] **API1** — Invalid token `invalidTokenClient` → 401/403
- [ ] **API1** — IDOR: `otherUserClient` cannot read/modify resource owned by user A
- [ ] **API2** — JWT `none` alg `noneAlgClient` → rejected
- [ ] **API2** — Auth token not present in `body` of any response
- [ ] **API3** — No stack traces in `body` on error responses
- [ ] **API3** — No internal file paths in `body` on error responses
- [ ] **API3** — No passwords/secrets/apiKeys in `body`
- [ ] **API5** — Regular user cannot call admin-only endpoints
- [ ] **API6** — Extra body fields (isAdmin, role, \_internalScore) not reflected in response
- [ ] **API8** — SQL injection payloads → no 5xx, no DB error strings in `body`
- [ ] **API8** — XSS payloads not reflected unescaped in `body`
- [ ] **API8** — SSTI payloads not evaluated (`{{7*7}}` must not become `49`)
- [ ] **Headers** — `x-content-type-options: nosniff` present
- [ ] **Headers** — `x-frame-options` present
- [ ] **Headers** — `x-powered-by` absent
- [ ] **Headers** — `server` header has no version number
- [ ] **Headers** — `content-type: application/json` on all JSON endpoints
