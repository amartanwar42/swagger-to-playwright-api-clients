# Step 1 -- Generate Test Cases

## What triggers this

```
#generate test cases [JIRA ticket URL or content]
```

## What to do

1. If input is a JIRA URL, fetch the ticket content from the URL.
2. Extract from the ticket:
   - HTTP method and path (the endpoint)
   - Acceptance criteria and business requirements
3. Open the generated types file for this endpoint:
   src/clients/generatedClients/<ServiceName>/<TagName>/types.ts
   Read the exact field names and types from the Request and Response interfaces.
   Use these exact names in the TC output -- never guess field names.
4. Open the generated client file to confirm the exact client method name.
5. Output ONLY the test case list -- no TypeScript, no imports, no test code.

---

## Output -- save as a file

Save to: tests/[ClientClass]/test-cases/[ClientClass].[HTTP-METHOD].test-cases.md
Example: tests/SignupClient/test-cases/SignupClient.POST.test-cases.md

File must contain exactly this structure:

ENDPOINT: [HTTP METHOD] [full path]
CLIENT METHOD: [exact method name]
CLIENT CLASS: [exact client class name]
REQUEST TYPE: [exact Request interface name, or NONE for GET/DELETE with no body]
RESPONSE TYPE: [exact Response interface name]
RESPONSE FIELDS:[every top-level field from the Response interface with its type]
[e.g. activityPlanScheduleId?: string]
[ activityPlanId?: string]
[ reminders?: Reminder[] | null]
[ repeatingDays?: number[]]
TYPES PATH: src/clients/generatedClients/[ServiceName]/[TagName]/types.ts
TEST FILE: tests/[ClientClass]/functional/[ClientClass].functional.spec.ts
SECURITY FILES: tests/[ClientClass]/security/auth.security.spec.ts
tests/[ClientClass]/security/injection.security.spec.ts
tests/[ClientClass]/security/headers.security.spec.ts
tests/[ClientClass]/security/data-exposure.security.spec.ts

---

FUNCTIONAL TEST CASES

---

[TYPE SHAPE]
TC-F01 Verify [field] is [type] in response body
TC-F02 Verify [nested object] contains expected fields
TC-F03 Verify [nullable array field] is array, null, or undefined
...

[CRUD LIFECYCLE]
TC-F0N Create [resource] with valid payload -> verify 200/201 and id returned
TC-F0N Fetch created [resource] by id -> verify fields match what was sent
TC-F0N Update [resource] [field] -> re-fetch and verify change persisted
TC-F0N Delete [resource] -> re-fetch and verify 404
...

[BUSINESS RULES]
TC-F0N [exact wording from JIRA acceptance criterion] -> [expected outcome]
...

[STATE PERSISTENCE]
TC-F0N Update [field] -> re-fetch -> verify new value persisted
...

[IDEMPOTENCY]
TC-F0N Call GET twice with same params -> verify identical responses
TC-F0N Call DELETE twice -> verify second returns 4xx
...

[EDGE CASES]
TC-F0N Send unicode string in [field] -> verify no 5xx
TC-F0N Omit optional params -> verify no 5xx
...

---

SECURITY TEST CASES

---

[AUTHENTICATION]
TC-S01 No Authorization header -> expect 401 or 403
TC-S02 Invalid bearer token -> expect 401 or 403
TC-S03 Malformed auth scheme -> expect 401 or 403
TC-S04 JWT with alg:none -> expect 401 or 403
TC-S05 Success body must not contain token, password, or secret

[OBJECT LEVEL AUTHORIZATION]
TC-S06 User B cannot access resource owned by User A -> expect 403 or 404

[INJECTION]
TC-S07 SQL injection in [string field] -> no 5xx, no DB error strings in body
TC-S08 XSS payloads in [string field] -> no 5xx, no unescaped script tags in body
TC-S09 SSTI probe in [string field] -> expression not evaluated in body

[MASS ASSIGNMENT]
TC-S10 Extra fields (isAdmin, role) in request body -> not reflected in response

[RESPONSE HEADERS]
TC-S11 x-content-type-options: nosniff present
TC-S12 x-frame-options present and DENY or SAMEORIGIN
TC-S13 x-powered-by absent
TC-S14 server header has no version number
TC-S15 content-type: application/json present

[DATA EXPOSURE]
TC-S16 Invalid id -> no stack trace in response body
TC-S17 Invalid id -> no internal file paths in response body
TC-S18 List response -> no sensitive fields in body

---

## Rules

- One TC per behaviour -- never combine two assertions in one TC
- TC-F for functional, TC-S for security -- number sequentially
- Use exact field names from types.ts -- never generic names
- Business rule TCs must map 1:1 to JIRA acceptance criteria
- Skip a group only if genuinely not applicable
  (no CRUD lifecycle for read-only GET, no mass assignment for GET/DELETE)
- DO NOT write any TypeScript or test code in this step

---

## After saving, tell the user exactly this

Saved to tests/[ClientClass]/test-cases/[filename].

Review the file:

- Edit any description
- Remove cases you do not need
- Add any cases I missed

When ready:
#generate-functional-tests #file:tests/[ClientClass]/test-cases/[filename]
#generate-security-tests #file:tests/[ClientClass]/test-cases/[filename]
