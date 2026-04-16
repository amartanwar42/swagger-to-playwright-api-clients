# Functional Test Skill

> Read `.github/skills/master.skill.md` first for framework contracts and golden rules.

---

## What Functional Tests Cover

- Type shape validation — body fields match generated types.ts
- Full CRUD lifecycle (create → read → update → delete → verify gone)
- Business logic — domain rules from JIRA acceptance criteria
- State persistence — update then re-fetch confirms change saved
- Idempotency — GET is side-effect free; repeated DELETE returns error
- Edge cases — unicode, missing optional fields, large payloads

---

## File Convention

```
tests/[ClientClass]/functional/[ClientClass].functional.spec.ts
```

---

## Imports

```typescript
import { test, expect } from '../../../src/fixtures/api.fixture';
import { TestDataGenerator } from '../../../src/utils/TestDataGenerator';
import { ApiAssertions } from '../../../src/utils/ApiAssertions';
import { TypeValidator } from '../../../src/utils/TypeValidator';
import { SetupHelpers } from '../../../src/helpers/SetupHelpers';
import { STATUS } from '../../../src/helpers/ApiStatusCodes';
import type { [REQUEST_TYPE], [RESPONSE_TYPE] } from '[TYPES_PATH]';
```

Never import CleanupManager — use the `cleanup` fixture.
Never import from `@playwright/test`.
Never use `test.beforeEach` or `test.afterEach`.

---

## TC Implementation Patterns

Replace placeholders when generating code:

- `[CLIENT_FIXTURE]` = camelCase fixture name from api.fixture.ts (e.g. signupClient)
- `[CLIENT METHOD]` = exact method from test-cases header
- `[resource]` = TestDataGenerator namespace (e.g. signup, activitySchedule)

### TYPE SHAPE

```typescript
test('should verify [field] is [type]', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const payload = TestDataGenerator.[resource].build();
  const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  if (ApiAssertions.isSuccess(status)) {
    cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
  }
  ApiAssertions.expectOneOf(status, [STATUS.OK, STATUS.CREATED]);
  TypeValidator.expectOptionalString(body, 'field');
});
```

Available TypeValidator methods:

- `expectOptionalString(obj, 'field')`
- `expectOptionalNumber(obj, 'field')`
- `expectOptionalBoolean(obj, 'field')`
- `expectOptionalArray(obj, 'field')`
- `expectNullableArray(obj, 'field')` — T[] | null | undefined
- `expectOptionalNumberArray(obj, 'field')` — number[] | undefined
- `expectOptionalISODate(obj, 'field')`
- `expectArrayOfObjects(obj, 'field', ['sub1', 'sub2'])`

### CRUD LIFECYCLE

All steps in one test():

```typescript
test('should complete full CRUD lifecycle', async ({ [CLIENT_FIXTURE], cleanup }) => {
  // CREATE
  const payload = TestDataGenerator.[resource].build();
  const { body: created, status: createStatus } = await [CLIENT_FIXTURE].[createMethod](payload);
  cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], created.[idField]!));
  ApiAssertions.expectOneOf(createStatus, [STATUS.OK, STATUS.CREATED]);

  // READ
  const { body: fetched, status: getStatus } = await [CLIENT_FIXTURE].[getMethod](created.[idField]!);
  ApiAssertions.expectStatus(getStatus, STATUS.OK);

  // UPDATE
  const updatePayload = TestDataGenerator.[resource].buildUpdate({ [idField]: created.[idField] });
  const { status: updateStatus } = await [CLIENT_FIXTURE].[updateMethod](updatePayload);
  ApiAssertions.expectStatus(updateStatus, STATUS.OK);

  // RE-FETCH & VERIFY
  const { body: reFetched } = await [CLIENT_FIXTURE].[getMethod](created.[idField]!);
  expect(reFetched.[updatedField]).toBe(updatePayload.[updatedField]);

  // DELETE & VERIFY GONE
  const { status: deleteStatus } = await [CLIENT_FIXTURE].[deleteMethod]({ [idField]: created.[idField] });
  ApiAssertions.expectOneOf(deleteStatus, [STATUS.OK, STATUS.NO_CONTENT]);
  const { status: goneStatus } = await [CLIENT_FIXTURE].[getMethod](created.[idField]!);
  ApiAssertions.expectClientError(goneStatus);
});
```

### BUSINESS RULES

One test() per TC:

```typescript
test('should [business rule from TC]', async ({ [CLIENT_FIXTURE], cleanup }) => {
  // Setup state via SetupHelpers
  // Call endpoint
  // Assert outcome
});
```

### STATE PERSISTENCE

```typescript
test('should persist [field] after update', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const created = await SetupHelpers.create[Resource]([CLIENT_FIXTURE]);
  cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], created.[idField]!));
  // update
  // re-fetch
  expect(body.[field]).toBe(newValue);
});
```

### IDEMPOTENCY

```typescript
// GET idempotency
test('should return identical responses on repeated GET', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const created = await SetupHelpers.create[Resource]([CLIENT_FIXTURE]);
  cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], created.[idField]!));
  const { body: first } = await [CLIENT_FIXTURE].[getMethod](created.[idField]!);
  const { body: second } = await [CLIENT_FIXTURE].[getMethod](created.[idField]!);
  expect(first).toEqual(second);
});

// DELETE idempotency
test('should return 4xx on second DELETE', async ({ [CLIENT_FIXTURE] }) => {
  const created = await SetupHelpers.create[Resource]([CLIENT_FIXTURE]);
  await [CLIENT_FIXTURE].[deleteMethod]({ [idField]: created.[idField] });
  const { status } = await [CLIENT_FIXTURE].[deleteMethod]({ [idField]: created.[idField] });
  ApiAssertions.expectClientError(status);
});
```

### EDGE CASES

```typescript
test('should handle unicode in string fields', async ({ [CLIENT_FIXTURE], cleanup }) => {
  const payload = TestDataGenerator.[resource].build({ [stringField]: TestDataGenerator.boundary.unicodeString });
  const { body, status } = await [CLIENT_FIXTURE].[CLIENT METHOD](payload);
  ApiAssertions.expectNoServerError(status);
  if (ApiAssertions.isSuccess(status)) {
    cleanup.register(() => SetupHelpers.delete[Resource]([CLIENT_FIXTURE], body.[idField]!));
  }
});
```

      activityClient,
    }) => {
      const from = '2024-06-01';
      const to = '2024-06-30';

      const { body, status } = await activityClient.getActivityActivityPlanSchedule({ from, to });
      ApiAssertions.expectStatus(status, STATUS.OK);

      // Every returned dueOn must fall within the requested range
      body.activities?.forEach((activity) => {
        if (activity.dueOn) {
          const dueDate = new Date(activity.dueOn);
          expect(dueDate.getTime()).toBeGreaterThanOrEqual(new Date(from).getTime());
          expect(dueDate.getTime()).toBeLessThanOrEqual(new Date(to).getTime());
        }
      });
    });

    test('should allow completing an existing activity schedule', async ({ activityClient }) => {
      const created = await SetupHelpers.createActivitySchedule(activityClient);
      cleanup.register(() =>
        SetupHelpers.deleteActivitySchedule(activityClient, created.activityPlanScheduleId!)
      );

      const completePayload = TestDataGenerator.activitySchedule.buildCompletion({
        activityPlanScheduleId: created.activityPlanScheduleId!,
        challangeScore: 5,
        usefullnessScore: 4,
        note: 'Completed via test',
      });

      const { status } =
        await activityClient.postActivityActivityPlanScheduleComplete(completePayload);
      ApiAssertions.expectOneOf(status, [STATUS.OK, STATUS.CREATED]);
    });

    test('should not allow completing a non-existent activity schedule', async ({
      activityClient,
    }) => {
      const completePayload = TestDataGenerator.activitySchedule.buildCompletion({
        activityPlanScheduleId: 'non-existent-id-000',
        challangeScore: 5,
        usefullnessScore: 4,
      });

      const { status } =
        await activityClient.postActivityActivityPlanScheduleComplete(completePayload);
      ApiAssertions.expectClientError(status);
    });

    test('should return raw schedule data with correct structure', async ({ activityClient }) => {
      const { body, status } = await activityClient.getActivityActivityPlanScheduleRaw();
      ApiAssertions.expectStatus(status, STATUS.OK);
      TypeValidator.expectOptionalArray(body, 'activities');
    });

    test('should persist energiser data after creation', async ({ activityClient }) => {
      const payload = TestDataGenerator.activitySchedule.buildWithEnergiser();
      const { body, status } = await activityClient.postActivityActivityPlanSchedule(payload);

      ApiAssertions.expectOneOf(status, [STATUS.OK, STATUS.CREATED]);
      cleanup.register(() =>
        SetupHelpers.deleteActivitySchedule(activityClient, body.activityPlanScheduleId!)
      );

      const { body: fetched } = await activityClient.getActivityActivityPlanScheduleById(
        body.activityPlanScheduleId!
      );

      if (fetched.energiser) {
        TypeValidator.expectOptionalString(fetched.energiser, '_id');
        TypeValidator.expectOptionalString(fetched.energiser, 'translatedName');
      }
    });

});

// ── Idempotency ──────────────────────────────────────────────────────────

test.describe('Idempotency', () => {
test('GET should return same body on repeated calls', async ({ activityClient }) => {
const params = {
from: TestDataGenerator.dates.thisMonthStart(),
to: TestDataGenerator.dates.thisMonthEnd(),
};

      const { body: first } = await activityClient.getActivityActivityPlanSchedule(params);
      const { body: second } = await activityClient.getActivityActivityPlanSchedule(params);

      expect(first).toEqual(second);
    });

    test('second DELETE should return 4xx', async ({ activityClient }) => {
      const created = await SetupHelpers.createActivitySchedule(activityClient);
      const id = created.activityPlanScheduleId!;

      await activityClient.deleteActivityActivityPlanSchedule({
        activityPlanScheduleId: id,
      });

      const { status } = await activityClient.deleteActivityActivityPlanSchedule({
        activityPlanScheduleId: id,
      });
      ApiAssertions.expectClientError(status);
    });

});

// ── Batch Operations ─────────────────────────────────────────────────────

test.describe('Batch Operations', () => {
test('should create multiple schedules via batch and return all', async ({
activityClient,
}) => {
const batchPayload = TestDataGenerator.activitySchedule.buildBatch(3);
const { body, status } =
await activityClient.postActivityActivityPlanScheduleBatch(batchPayload);

      ApiAssertions.expectOneOf(status, [STATUS.OK, STATUS.CREATED]);
      TypeValidator.expectOptionalArray(body, 'activities');
    });

    test('should update multiple schedules via batch', async ({ activityClient }) => {
      // Create 2 schedules first
      const s1 = await SetupHelpers.createActivitySchedule(activityClient);
      const s2 = await SetupHelpers.createActivitySchedule(activityClient);
      cleanup.register(() =>
        SetupHelpers.deleteActivitySchedule(activityClient, s1.activityPlanScheduleId!)
      );
      cleanup.register(() =>
        SetupHelpers.deleteActivitySchedule(activityClient, s2.activityPlanScheduleId!)
      );

      const batchUpdatePayload = TestDataGenerator.activitySchedule.buildBatchUpdate([
        s1.activityPlanScheduleId!,
        s2.activityPlanScheduleId!,
      ]);

      const { status } =
        await activityClient.putActivityActivityPlanScheduleBatch(batchUpdatePayload);
      ApiAssertions.expectOneOf(status, [STATUS.OK, STATUS.NO_CONTENT]);
    });

});

// ── Edge Cases ──────────────────────────────────────────────────────────

test.describe('Edge Cases', () => {
test('should handle request with no date range params', async ({ activityClient }) => {
const { status } = await activityClient.getActivityActivityPlanSchedule();
// API may return 200 with default range, or 400 if dates required
ApiAssertions.expectNoServerError(status);
});

    test('should handle repeatingDays as number array correctly', async ({ activityClient }) => {
      const payload = TestDataGenerator.activitySchedule.buildRepeating({
        repeatingDays: [1, 3, 5], // Mon, Wed, Fri
      });
      const { body, status } = await activityClient.postActivityActivityPlanSchedule(payload);

      ApiAssertions.expectNoServerError(status);
      if (status === STATUS.OK || status === STATUS.CREATED) {
        cleanup.register(() =>
          SetupHelpers.deleteActivitySchedule(activityClient, body.activityPlanScheduleId!)
        );
      }
    });

    test('should not return 5xx for any valid payload variant', async ({ activityClient }) => {
      const payload = TestDataGenerator.activitySchedule.build();
      const { body, status } = await activityClient.postActivityActivityPlanSchedule(payload);

      ApiAssertions.expectNoServerError(status);
      if (status === STATUS.OK || status === STATUS.CREATED) {
        cleanup.register(() =>
          SetupHelpers.deleteActivitySchedule(activityClient, body.activityPlanScheduleId!)
        );
      }
    });

});
});

```

---

## Functional Test Checklist

For each Swagger tag / client, cover:

- [ ] Type shape validation for every 2xx response (use `TypeValidator`)
- [ ] Nested object shapes (`completionData`, `energiser`, `reminders`)
- [ ] `reminders` typed as `array | null | undefined` — handle all variants
- [ ] Full CRUD lifecycle in one ordered test
- [ ] Business rules (date range filtering, status transitions, required relationships)
- [ ] State persistence — update then re-fetch confirms change
- [ ] Idempotent GET — same body on repeated call
- [ ] Idempotent DELETE — 4xx on second delete
- [ ] Batch endpoints (POST batch, PUT batch) if generated
- [ ] Edge cases: missing optional params, empty arrays, date boundaries
- [ ] No 5xx on any valid input
- [ ] Cleanup registered before assertions (so it runs even on test failure)
```
