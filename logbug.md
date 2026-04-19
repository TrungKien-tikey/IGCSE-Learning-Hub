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
- Retest Version: `local-dev-auth-logout-fix-2026-04-16`
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
| `BUG-AUTH-BVA-01` | `F01,F02` | `TC_RG_01,03,04,05,07; TC_LG_01,04,06` | `local-dev-auth-2026-04-16` | `Critical` | `High` | Missing/invalid input must fail with clean `400` validation response | Register accepted bad payload or leaked ORM/SQL internals; login missing/empty fields returned `401` instead of `400` | Execution result tables above | Fixed | Backend | `local-dev-auth-register-fix-2026-04-16` | `Function 1 pass 6/6; Function 2 validation pass 5/5` | Login scope was fixed first, and register validation is now fixed with Bean Validation on `RegisterRequest`, `@Valid` on `AuthController.register()`, and clean validation responses. |
| `BUG-AUTH-BVA-02` | `F02` | `TC_RG_02,06` | `local-dev-auth-2026-04-16` | `Major` | `Medium` | Register success must return `201 Created` | API returned `200 OK` | Execution result table above | Fixed | Backend | `local-dev-auth-register-fix-2026-04-16` | `TC_RG_02 pass; TC_RG_06 pass` | `AuthController.register()` now returns `ResponseEntity.status(HttpStatus.CREATED)` |
| `BUG-AUTH-BVA-03` | `F02` | `TC_RG_08` | `local-dev-auth-2026-04-16` | `Major` | `Medium` | Duplicate email must return `409 Conflict` | API returned `400 Bad Request` | Execution result table above | Fixed | Backend | `local-dev-auth-register-fix-2026-04-16` | `TC_RG_08 pass` | Added dedicated `DuplicateEmailException` mapped to `409 Conflict` |
| `BUG-AUTH-BVA-04` | `F01,F02` | `TC_RG_05 -> TC_LG_02` | `local-dev-auth-2026-04-16` | `Critical` | `High` | Invalid-format email must never be persisted or authenticated | Invalid email user was created and later login returned a valid JWT pair | Execution result tables above | Fixed | Backend | `local-dev-auth-register-fix-2026-04-16` | `TC_RG_05 pass; stale invalid rows deleted` | Register now blocks invalid-format emails and 5 stale invalid-email rows were removed from local `auth_db.users`. |
| `BUG-AUTH-BVA-05` | `F03` | `TC_LO_01,02,03` | `local-dev-auth-2026-04-16` | `Major` | `High` | Unauthorized logout attempts should return `401` JSON | Spring Security returned `403 Forbidden` | Execution result table above | Fixed | Backend | `local-dev-auth-logout-fix-2026-04-16` | `TC_LO_01 pass; TC_LO_02 pass; TC_LO_03 pass; TC_LO_04 pass` | Added `AuthenticationEntryPoint` for consistent `401` JSON and updated JWT filter to stop invalid, expired, and blacklisted token requests early. |

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
- Register-related validation defects were tracked separately and are covered in the register retest report below

## Retest Report - register scope

Implemented fix:
- Added Bean Validation to `RegisterRequest`
- Added `@Valid` to `AuthController.register()`
- Changed register success response to `201 Created`
- Added `DuplicateEmailException` and mapped it to `409 Conflict`
- Trimmed `fullName` and `email` before persistence
- Deleted stale invalid-email rows from local `auth_db.users`

Retest environment:
- Retest version: `local-dev-auth-register-fix-2026-04-16`
- Retest date: `2026-04-16`
- Endpoint: `POST /api/auth/register`

Retest result:
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_RG_01` | `400` | `400` | Pass | Empty `fullName` now returns clean validation error |
| `TC_RG_02` | `201` | `201` | Pass | Min boundary full name is accepted |
| `TC_RG_03` | `400` | `400` | Pass | Over-max `fullName` now fails before hitting DB |
| `TC_RG_04` | `400` | `400` | Pass | Missing `email` returns validation error |
| `TC_RG_05` | `400` | `400` | Pass | Invalid email format is blocked before persistence |
| `TC_RG_06` | `201` | `201` | Pass | Valid 254-character email is accepted |
| `TC_RG_07` | `400` | `400` | Pass | 255-character email is rejected with size validation |
| `TC_RG_08` | `409` | `409` | Pass | Duplicate email now returns conflict |

Data cleanup:
- Deleted 2 users created during retest (`TC_RG_02`, `TC_RG_06`)
- Deleted 5 stale rows with invalid email values from local `auth_db.users`

Summary:
- Register retest passed `8/8`
- `BUG-AUTH-BVA-01`, `BUG-AUTH-BVA-02`, `BUG-AUTH-BVA-03`, and `BUG-AUTH-BVA-04` are fixed in the local auth-service build
- The logout bug is handled in the next retest section below

## Retest Report - logout scope

Implemented fix:
- Added `RestAuthenticationEntryPoint` to return consistent `401` JSON
- Configured `SecurityConfig` to use the custom authentication entry point
- Updated `JwtAuthenticationFilter` to stop blacklisted, malformed, and expired token requests with `401`

Retest environment:
- Retest version: `local-dev-auth-logout-fix-2026-04-16`
- Retest date: `2026-04-16`
- Endpoint: `POST /api/auth/logout`

Retest result:
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_LO_01` | `401` | `401` | Pass | Missing token now returns JSON unauthorized response |
| `TC_LO_02` | `401` | `401` | Pass | Malformed token returns `401` with `Invalid or expired token` |
| `TC_LO_03` | `401` | `401` | Pass | Expired token returns `401` with consistent JSON body |
| `TC_LO_04` | `200` | `200` | Pass | Valid token still logs out successfully |

Summary:
- Logout retest passed `4/4`
- `BUG-AUTH-BVA-05` is fixed in the local auth-service build
- Function 1 to 3 now have no open bugs in this log

## Next Fix Plan
1. Test `Function 4 - forgotPassword`
   - Retest `TC_FP_01` for missing `email`
   - Retest `TC_FP_02` for invalid email format
   - Retest `TC_FP_03` for email not found
   - Retest `TC_FP_04` for valid existing email

## Severity Rule
- `Critical`: blocks core auth flow or allows bad data/security behavior
- `Major`: wrong status code, wrong auth behavior, or API contract mismatch
- `Minor`: message format issue with no core behavior impact
