# Log Bug Tasks

This file is the system of record for versioned auth-service test execution, bug logging, fix status, and retest outcome.

## Scope
- Function 1: `login`
- Function 2: `register`
- Function 3: `logout`
- Function 4: `forgotPassword`
- Function 5: `changePassword`
- Function 6: `securityFilterChain`
- Function 7: `doFilterInternal`

## Release Tracks
- Version 1 branch: `test/v1-f1-f3-baseline`
- Version 2 branch: `test/v2-f4-f5`
- Version 3 branch: `test/v3-f6-f7`

## Test Cycle
- Version 1 baseline label: `local-dev-auth-v1-regression-2026-04-19`
- Version 2 active label: `local-dev-auth-v2-fix-2026-04-19`
- Version 3 active label: `local-dev-auth-v3-fix-2026-04-19`
- Base URL: `http://localhost:8088`
- Request source for automation: `Testing/scripts/auth-test-common.ps1`
- Runner target: `Postman/Newman`

## Pre-check
- [x] MySQL reachable on `localhost:3310`
- [x] RabbitMQ reachable on `localhost:5672`
- [x] Auth service expected on `http://localhost:8088`
- [x] Valid account locked for testing: `user5@example.com / abc321`
- [x] Duplicate email locked for testing: `user4@example.com`
- [x] Expired token strategy locked to hardcoded `JwtUtils` secret
- [x] Canonicalized docs required before any version run

## Version 1 - Baseline Closed (Function 1 to 3)

### Task List

#### Function 1 - login
| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_LG_01` | Missing `email` | `400 Bad Request` |
| [x] | `TC_LG_02` | Invalid email format | `400 Bad Request` |
| [x] | `TC_LG_03` | Valid email + valid password | `200 OK` |
| [x] | `TC_LG_04` | Missing `password` | `400 Bad Request` |
| [x] | `TC_LG_05` | Wrong password | `401 Unauthorized` |
| [x] | `TC_LG_06` | Empty password | `400 Bad Request` |

#### Function 2 - register
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

#### Function 3 - logout
| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_LO_01` | Missing token | `401 Unauthorized` |
| [x] | `TC_LO_02` | Malformed token | `401 Unauthorized` |
| [x] | `TC_LO_03` | Expired token | `401 Unauthorized` |
| [x] | `TC_LO_04` | Valid token | `200 OK` |

### Execution Result - historical discovery run

#### Function 1 - login
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_LG_01` | `400` | `401` | Fail | Missing `email` was treated as bad credentials instead of validation error |
| `TC_LG_02` | `400` | `200` | Fail | Invalid-format email `user5example.com` authenticated successfully and returned token |
| `TC_LG_03` | `200` | `200` | Pass | Returned access token and refresh token |
| `TC_LG_04` | `400` | `401` | Fail | Missing `password` was treated as bad credentials instead of validation error |
| `TC_LG_05` | `401` | `401` | Pass | Behavior matched expected result |
| `TC_LG_06` | `400` | `401` | Fail | Empty password was not validated |

#### Function 2 - register
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

#### Function 3 - logout
| Test Case | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- |
| `TC_LO_01` | `401` | `403` | Fail | Missing token returned Spring Security default `403 Forbidden` |
| `TC_LO_02` | `401` | `403` | Fail | Malformed token returned `403` instead of `401` |
| `TC_LO_03` | `401` | `403` | Fail | Expired token returned `403` instead of `401` |
| `TC_LO_04` | `200` | `200` | Pass | Returned `Logged out` |

### Bug Log - historical V1 bugs
| Bug ID | Function | Test Case | Version Detected | Severity | Priority | Expected | Actual | Status | Fixed In Version | Retest Result | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-AUTH-BVA-01` | `F01,F02` | `TC_RG_01,03,04,05,07; TC_LG_01,04,06` | `local-dev-auth-2026-04-16` | `Critical` | `High` | Missing/invalid input must fail with clean `400` validation response | Register accepted bad payload or leaked ORM/SQL internals; login missing/empty fields returned `401` instead of `400` | Fixed | `local-dev-auth-register-fix-2026-04-16` | `Function 1 pass 6/6; Function 2 validation pass 5/5` | Bean Validation + `@Valid` + clean exception handling were added. |
| `BUG-AUTH-BVA-02` | `F02` | `TC_RG_02,06` | `local-dev-auth-2026-04-16` | `Major` | `Medium` | Register success must return `201 Created` | API returned `200 OK` | Fixed | `local-dev-auth-register-fix-2026-04-16` | `TC_RG_02 pass; TC_RG_06 pass` | `AuthController.register()` now returns `201 Created`. |
| `BUG-AUTH-BVA-03` | `F02` | `TC_RG_08` | `local-dev-auth-2026-04-16` | `Major` | `Medium` | Duplicate email must return `409 Conflict` | API returned `400 Bad Request` | Fixed | `local-dev-auth-register-fix-2026-04-16` | `TC_RG_08 pass` | Added `DuplicateEmailException` mapped to `409 Conflict`. |
| `BUG-AUTH-BVA-04` | `F01,F02` | `TC_RG_05 -> TC_LG_02` | `local-dev-auth-2026-04-16` | `Critical` | `High` | Invalid-format email must never be persisted or authenticated | Invalid email user was created and later login returned a valid JWT pair | Fixed | `local-dev-auth-register-fix-2026-04-16` | `TC_RG_05 pass` | Invalid-format email rows were cleaned up from local DB. |
| `BUG-AUTH-BVA-05` | `F03` | `TC_LO_01,02,03` | `local-dev-auth-2026-04-16` | `Major` | `High` | Unauthorized logout attempts should return `401` JSON | Spring Security returned `403 Forbidden` | Fixed | `local-dev-auth-logout-fix-2026-04-16` | `TC_LO_01 pass; TC_LO_02 pass; TC_LO_03 pass; TC_LO_04 pass` | Added custom `AuthenticationEntryPoint` and stricter JWT filter handling. |

### Retest Summary - V1 baseline
- Login retest passed `6/6`
- Register retest passed `8/8`
- Logout retest passed `4/4`
- Postman/Newman rerun on `2026-04-18` passed `18/18`
- Version 1 is treated as closed baseline unless regression is reproduced

## Version 2 - Closed After Fix (Function 4 to 5)

### Task List

#### Function 4 - forgotPassword
| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_FP_01` | Missing `email` query param | `400 Bad Request` |
| [x] | `TC_FP_02` | Invalid email format via query param | `400 Bad Request` |
| [x] | `TC_FP_03` | Email not found | `400 Bad Request` |
| [x] | `TC_FP_04` | Valid existing email | `200 OK` |

#### Function 5 - changePassword
| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_CP_01` | Missing `oldPassword` with valid JWT | `400 Bad Request` |
| [x] | `TC_CP_02` | Wrong `oldPassword` with valid JWT | `400 Bad Request` |
| [x] | `TC_CP_03` | Missing `newPassword` with valid JWT | `400 Bad Request` |
| [x] | `TC_CP_04` | Empty `newPassword` with valid JWT | `400 Bad Request` |
| [x] | `TC_CP_05` | Valid change password | `200 OK` |

### Version 2 Notes
- Function 4 must always use `POST /api/auth/forgot-password?email=...`
- Function 5 must always include `Authorization: Bearer <valid_token>`
- Postman harness issue that previously produced `Bearer ` headers was fixed in `Testing/scripts/auth-test-common.ps1`; results below are from the corrected rerun.

### Execution Result - Version 2
- Discovery run on `2026-04-18`: `7/10` assertions passed, `3/10` failed
- Fix + rerun on `2026-04-18`: `10/10` assertions passed
- Verified cases:
  - `TC_FP_01..04`
  - `TC_CP_01..05`
- Recovery note:
  - `user5@example.com` was restored to `abc321` after the earlier failing run via `POST /api/auth/reset-password`
  - After code fix, the full V2 suite completed without mutating the account into an invalid state

### Bug Log - Version 2
| Bug ID | Function | Test Case | Version Detected | Severity | Priority | Expected | Actual | Status | Fixed In Version | Retest Result | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-AUTH-V2-01` | `F04` | `TC_FP_01` | `local-dev-auth-v2-fix-2026-04-18` | `Major` | `High` | Missing `email` query param must return `400 Bad Request` | Endpoint returned `500 Internal Server Error` | Fixed | `auth-service-testing-v2` | `TC_FP_01` pass in full V2 rerun | Added clean handling for missing request parameters in `GlobalExceptionHandler`. |
| `BUG-AUTH-V2-02` | `F05` | `TC_CP_04` | `local-dev-auth-v2-fix-2026-04-18` | `Critical` | `High` | Empty `newPassword` must be rejected with `400 Bad Request` | Endpoint returned `200 OK` and changed the password | Fixed | `auth-service-testing-v2` | `TC_CP_04` pass in full V2 rerun | Added Bean Validation for `ChangePasswordRequest` and `@Valid` on controller. |
| `BUG-AUTH-V2-03` | `F05` | `TC_CP_05` | `local-dev-auth-v2-fix-2026-04-18` | `Minor` | `Medium` | Valid change-password case should return `200 OK` with known baseline password | Full-run execution returned `400` because prior invalid case corrupted account state | Closed - dependent | `local-dev-auth-v2-retest-2026-04-18` | `TC_CP_05` pass | Not a standalone product bug; isolated retest passed after state recovery. |

### Release Note - Version 2
- `V2` is ready for release after the full Postman/Newman rerun passed `10/10`
- Auth cross-version regression remains green:
  - `V1`: `18/18`
  - `V2`: `10/10`
  - `V3`: `11/11`

## Version 3 - Closed After Regression (Function 6 to 7)

### Task List

#### Function 6 - securityFilterChain
| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_SFC_01` | Protected endpoint without token | `401 Unauthorized` |
| [x] | `TC_SFC_02` | Protected endpoint with invalid token | `401 Unauthorized` |
| [x] | `TC_SFC_03` | Protected endpoint with valid token | `200 OK` |
| [x] | `TC_SFC_04` | Public endpoint without auth | `200 OK` |

#### Function 7 - doFilterInternal
| Done | Test Case | Scenario | Expected |
| --- | --- | --- | --- |
| [x] | `TC_DFI_01` | Missing `Authorization` header | `401 Unauthorized` |
| [x] | `TC_DFI_02` | Invalid `Bearer` prefix | `401 Unauthorized` |
| [x] | `TC_DFI_03` | Invalid JWT | `401 Unauthorized` |
| [x] | `TC_DFI_04` | Expired JWT | `401 Unauthorized` |
| [x] | `TC_DFI_05` | Valid JWT | `200 OK` |

### Version 3 Notes
- Remove any placeholder `/api/protected` usage; protected endpoint is `POST /api/auth/logout`
- Public endpoint is `GET /api/auth/health`
- Version 3 must finish with cross-version regression `F1-F7`
- Test harness note:
  - `Testing/scripts/auth-test-common.ps1` canonicalization precheck was updated to accept closed-state doc sections so reruns do not fail on already-fixed versions

### Execution Result - Version 3
- Postman/Newman execution on `2026-04-19`: `11/11` requests passed, `11/11` assertions passed
- All security contract cases passed:
  - `TC_SFC_01..04`
  - `TC_DFI_01..05`
- Fresh login token setup before `TC_SFC_03` and `TC_DFI_05` worked as intended
- Cross-version regression on `2026-04-19` also passed on the same branch:
  - `V1`: `18/18`
  - `V2`: `10/10`
  - `V3`: `11/11`

### Bug Log - Version 3
- No V3 product bugs were reproduced on the current branch

### Release Note - Version 3
- `V3` is ready for release after the full Postman/Newman rerun passed `11/11`
- Release acceptance is satisfied because the full regression `F1-F7` passed on `2026-04-19`

## Mockdata Cleanup
- Removed seeded `course_slot_packages` sample rows from [docker/init-db.sql](</c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/docker/init-db.sql:1>)
- Replaced hardcoded parent analytics effort score with computed data in [StatisticsService.java](</c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/ai-service/src/main/java/com/igcse/ai/service/thongKe/StatisticsService.java:1>)
- Removed demo OpenAI key fallback in [LangChain4jConfig.java](</c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/ai-service/src/main/java/com/igcse/ai/config/LangChain4jConfig.java:1>)
- Replaced mocked email log wording in [EmailService.java](</c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/auth-service/src/main/java/com/igcse/auth/service/EmailService.java:1>)
- Replaced frontend `mockUser` display object with real display-state naming in [MainLayout.jsx](</c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/frontend/src/layouts/MainLayout.jsx:1>)

## Severity Rule
- `Critical`: blocks core auth flow or allows bad data/security behavior
- `Major`: wrong status code, wrong auth behavior, or API contract mismatch
- `Minor`: message format issue with no core behavior impact
