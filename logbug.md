# Log Bug Tasks

This file replaces the Excel tracker for BVA test execution and bug logging.

## Scope
- Function 1: `login`
- Function 2: `register`
- Function 3: `logout`
- Function 4: `forgotPassword`
- Function 5: `changePassword`
- Function 6: `securityFilterChain`
- Function 7: `doFilterInternal`

## Test Cycle
- Current Test Version: `local-dev-auth-2026-04-16`
- Retest Version: `local-dev-auth-login-fix-2026-04-16`
- Tester: `Codex`
- Test Date: `2026-04-16`
- Base URL: `http://localhost:8088`
- Request source: [postman_collection.json](/c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/postman_collection.json:1)

## Pre-check
- [x] Start infra and auth-service
- [x] Confirm `auth_base = http://localhost:8088`
- [x] Prepare valid account `user5@example.com / abc321`
- [x] Prepare duplicate email `user4@example.com`
- [x] Prepare valid token from successful login
- [x] Prepare malformed token and expired token for auth tests

## Task List

### Function 1 - login
Scope: `AuthController.login`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_LG_01` | Missing `email` | `400 Bad Request` |
| [x] | `TC_LG_02` | Invalid email format | `400 Bad Request` |
| [x] | `TC_LG_03` | Valid email + valid password | `200 OK` |
| [x] | `TC_LG_04` | Missing `password` | `400 Bad Request` |
| [x] | `TC_LG_05` | Wrong password | `401 Unauthorized` |
| [x] | `TC_LG_06` | Empty password | `400 Bad Request` |

### Function 2 - register
Scope: `AuthController.register`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_RG_01` | Empty `fullName` | `400 Bad Request` |
| [x] | `TC_RG_02` | `fullName` at min boundary | `201 Created` |
| [x] | `TC_RG_03` | `fullName` over max boundary | `400 Bad Request` |
| [x] | `TC_RG_04` | Missing `email` | `400 Bad Request` |
| [x] | `TC_RG_05` | Invalid email format | `400 Bad Request` |
| [x] | `TC_RG_06` | Email at max boundary | `201 Created` |
| [x] | `TC_RG_07` | Email over max boundary | `400 Bad Request` |
| [x] | `TC_RG_08` | Duplicate email | `409 Conflict` |

### Function 3 - logout
Scope: `AuthController.logout`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_LO_01` | Missing token | `401 Unauthorized` |
| [x] | `TC_LO_02` | Malformed token | `401 Unauthorized` |
| [x] | `TC_LO_03` | Expired token | `401 Unauthorized` |
| [x] | `TC_LO_04` | Valid token | `200 OK` |

### Function 4 - forgotPassword
Scope: `AuthController.forgotPassword`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [ ] | `TC_FP_01` | Missing `email` | `400 Bad Request` |
| [ ] | `TC_FP_02` | Invalid email format | `400 Bad Request` |
| [ ] | `TC_FP_03` | Email not found | `404 Not Found` |
| [ ] | `TC_FP_04` | Valid existing email | `200 OK` |

### Function 5 - changePassword
Scope: `AuthController.changePassword`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [ ] | `TC_CP_01` | Missing `oldPassword` | `400 Bad Request` |
| [ ] | `TC_CP_02` | Wrong `oldPassword` | `401 Unauthorized` |
| [ ] | `TC_CP_03` | Missing `newPassword` | `400 Bad Request` |
| [ ] | `TC_CP_04` | Empty `newPassword` | `400 Bad Request` |
| [ ] | `TC_CP_05` | Valid change password | `200 OK` |

### Function 6 - securityFilterChain
Scope: `SecurityConfig.securityFilterChain`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [ ] | `TC_SFC_01` | Protected endpoint without token | `401 Unauthorized` |
| [ ] | `TC_SFC_02` | Protected endpoint with invalid token | `401 Unauthorized` |
| [ ] | `TC_SFC_03` | Protected endpoint with valid token | `200 OK` |
| [ ] | `TC_SFC_04` | Public endpoint without auth | `200 OK` |

### Function 7 - doFilterInternal
Scope: `JwtAuthenticationFilter.doFilterInternal`

| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [ ] | `TC_DFI_01` | Missing `Authorization` header | `401 Unauthorized` |
| [ ] | `TC_DFI_02` | Invalid `Bearer` prefix | `401 Unauthorized` |
| [ ] | `TC_DFI_03` | Invalid JWT | `401 Unauthorized` |
| [ ] | `TC_DFI_04` | Expired JWT | `401 Unauthorized` |
| [ ] | `TC_DFI_05` | Valid JWT | `200 OK` |

## Execution Result - Function 1 to 3

Notes:
- Requests were executed against the live local auth-service using the endpoints defined in the Postman collection.
- Dynamic register emails created during this run were removed from `auth_db` after testing.

### Function 1 - login
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_LG_01` | `400` | `401` | Fail | Missing `email` was treated as bad credentials instead of validation error |
| `TC_LG_02` | `400` | `200` | Fail | Invalid-format email `user5example.com` authenticated successfully and returned token |
| `TC_LG_03` | `200` | `200` | Pass | Returned access token and refresh token |
| `TC_LG_04` | `400` | `401` | Fail | Missing `password` was treated as bad credentials instead of validation error |
| `TC_LG_05` | `401` | `401` | Pass | Behavior matched expected result |
| `TC_LG_06` | `400` | `401` | Fail | Empty password was not validated |

### Function 2 - register
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_RG_01` | `400` | `200` | Fail | Empty `fullName` still created user |
| `TC_RG_02` | `201` | `200` | Fail | Success status code is wrong |
| `TC_RG_03` | `400` | `400` | Partial | Correct status, but response leaked SQL/Data truncation details |
| `TC_RG_04` | `400` | `400` | Partial | Correct status, but response leaked JPA not-null details |
| `TC_RG_05` | `400` | `200` | Fail | Invalid email format still created user |
| `TC_RG_06` | `201` | `200` | Fail | Success status code is wrong |
| `TC_RG_07` | `400` | `200` | Fail | Email above BVA max boundary was accepted |
| `TC_RG_08` | `409` | `400` | Fail | Duplicate email returned wrong status code |

### Function 3 - logout
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_LO_01` | `401` | `403` | Fail | Missing token returned Spring Security default `403 Forbidden` |
| `TC_LO_02` | `401` | `403` | Fail | Malformed token returned `403` instead of `401` |
| `TC_LO_03` | `401` | `403` | Fail | Expired token returned `403` instead of `401` |
| `TC_LO_04` | `200` | `200` | Pass | Returned `Logged out` |

## Bug Log
| Bug ID | Function | Test Case | Version Detected | Severity | Priority | Expected | Actual | Evidence | Status | Assignee | Fixed In Version | Retest Result | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-AUTH-BVA-01` | `F01,F02` | `TC_RG_01,03,04,05,07; TC_LG_01,04,06` | `local-dev-auth-2026-04-16` | `Critical` | `High` | Missing/invalid input must fail with clean `400` validation response | Register accepted bad payload or leaked ORM/SQL internals; login missing/empty fields returned `401` instead of `400` | Execution result tables above | Partial Fix | Backend | `local-dev-auth-login-fix-2026-04-16` | `Function 1 pass 6/6; Function 2 pending` | Login scope fixed by Bean Validation on `LoginRequest`, `@Valid` on `AuthController.login()`, and `MethodArgumentNotValidException` handler. Register scope is still open. |
| `BUG-AUTH-BVA-02` | `F02` | `TC_RG_02,06` | `local-dev-auth-2026-04-16` | `Major` | `Medium` | Register success must return `201 Created` | API returned `200 OK` | Execution result table above | Open | Backend |  |  | `AuthController.register()` uses `ResponseEntity.ok(...)` |
| `BUG-AUTH-BVA-03` | `F02` | `TC_RG_08` | `local-dev-auth-2026-04-16` | `Major` | `Medium` | Duplicate email must return `409 Conflict` | API returned `400 Bad Request` | Execution result table above | Open | Backend |  |  | Needs dedicated conflict exception / handler |
| `BUG-AUTH-BVA-04` | `F01,F02` | `TC_RG_05 -> TC_LG_02` | `local-dev-auth-2026-04-16` | `Critical` | `High` | Invalid-format email must never be persisted or authenticated | Invalid email user was created and later login returned a valid JWT pair | Execution result tables above | Open | Backend |  |  | Data integrity and auth correctness issue |
| `BUG-AUTH-BVA-05` | `F03` | `TC_LO_01,02,03` | `local-dev-auth-2026-04-16` | `Major` | `High` | Unauthorized logout attempts should return `401` JSON | Spring Security returned `403 Forbidden` | Execution result table above | Open | Backend |  |  | Missing `AuthenticationEntryPoint` and inconsistent JWT failure handling |

## Retest Report - BUG-AUTH-BVA-01 login scope

Implemented fix:
- Added `spring-boot-starter-validation` to `auth-service`
- Added `@NotBlank` and `@Email` to `LoginRequest`
- Added `@Valid` to `AuthController.login()`
- Added `MethodArgumentNotValidException` handler in `GlobalExceptionHandler`

Retest environment:
- Retest version: `local-dev-auth-login-fix-2026-04-16`
- Retest date: `2026-04-16`
- Endpoint: `POST /api/auth/login`

Retest result:
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_LG_01` | `400` | `400` | Pass | Response now returns field=`email`, message=`Email is required` |
| `TC_LG_02` | `400` | `400` | Pass | Invalid email format is blocked before authentication |
| `TC_LG_03` | `200` | `200` | Pass | Valid login still returns access token and refresh token |
| `TC_LG_04` | `400` | `400` | Pass | Response now returns field=`password`, message=`Password is required` |
| `TC_LG_05` | `401` | `401` | Pass | Wrong password behavior is unchanged and still correct |
| `TC_LG_06` | `400` | `400` | Pass | Empty password is now treated as validation error |

Summary:
- Login retest passed `6/6`
- The login part of `BUG-AUTH-BVA-01` is fixed
- Register-related validation defects under `BUG-AUTH-BVA-01` still need a separate fix and retest

## Fix Plan
1. Fix `BUG-AUTH-BVA-01`
   - Add Bean Validation to `RegisterRequest`
     - `@NotBlank` for `fullName`, `email`, `password`
     - `@Email` for `email`
     - `@Size(max = 255)` for `fullName`
     - `@Size(max = 254)` for `email`
   - Add Bean Validation to `LoginRequest`
     - `@NotBlank` for `email`, `password`
     - `@Email` for `email`
   - Add `@Valid` in `AuthController.register()` and `AuthController.login()`
   - Add `MethodArgumentNotValidException` handling in `GlobalExceptionHandler`
   - Replace ORM/SQL error leakage with clean field-level validation messages

2. Fix `BUG-AUTH-BVA-02`
   - Change register success response to `ResponseEntity.status(HttpStatus.CREATED).body(...)`

3. Fix `BUG-AUTH-BVA-03`
   - Replace generic `RuntimeException` for duplicate email with a dedicated exception
   - Map that exception to `409 Conflict`

4. Fix `BUG-AUTH-BVA-04`
   - Clean invalid email rows already stored in `auth_db.users`
   - After validation fix, confirm invalid-format emails cannot be created again
   - Retest `TC_RG_05` and `TC_LG_02`

5. Fix `BUG-AUTH-BVA-05`
   - Configure `authenticationEntryPoint` in `SecurityConfig` to always return `401` JSON for unauthenticated access
   - In `JwtAuthenticationFilter`, short-circuit malformed, expired, and blacklisted token cases with explicit `401`
   - Keep unauthorized response format consistent across auth endpoints

6. Retest order after fix
   - Retest all Function 2 cases first (`TC_RG_01 -> TC_RG_08`)
   - Retest all Function 1 cases (`TC_LG_01 -> TC_LG_06`)
   - Retest all Function 3 cases (`TC_LO_01 -> TC_LO_04`)
   - Confirm no invalid user rows are inserted during retest

## Severity Rule
- `Critical`: blocks core auth flow or allows bad data/security behavior
- `Major`: wrong status code, wrong auth behavior, or API contract mismatch
- `Minor`: message format issue with no core behavior impact
