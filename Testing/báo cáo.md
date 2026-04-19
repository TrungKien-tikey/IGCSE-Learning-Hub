# Bao Cao Bug Theo Version - auth-service

Nguon tong hop:
- `Testing/BVA-test.md`
- `Testing/intergration-test.md`
- `Testing/logbug.md`
- `Testing/unit-test.md`

## Tong quan release

| Version | Branch | Scope | Status | Release label |
| --- | --- | --- | --- | --- |
| `V1` | `test/v1-f1-f3-baseline` | `login`, `register`, `logout` | Verified pass by Postman/Newman rerun | `local-dev-auth-v1-regression-2026-04-19` |
| `V2` | `test/v2-f4-f5` | `forgotPassword`, `changePassword` | Release-ready after fix | `local-dev-auth-v2-fix-2026-04-19` |
| `V3` | `test/v3-f6-f7` | `securityFilterChain`, `doFilterInternal` | Release-ready after full regression | `local-dev-auth-v3-fix-2026-04-19` |

## Version 1 - Baseline da dong

### Pham vi
- Function 1: `login`
- Function 2: `register`
- Function 3: `logout`

### Ket qua
- Toan bo baseline `F1-F3` da co lich su discovery, fix, va retest day du.
- V1 duoc xem la baseline da dong; chi mo lai neu regression tai hien duoc.
- Postman/Newman rerun ngay `2026-04-18` pass `18/18` assertions.

### Bug da fix trong V1

#### BUG-AUTH-BVA-01
- Pham vi: `login`, `register`
- Test case: `TC_LG_01`, `TC_LG_04`, `TC_LG_06`, `TC_RG_01`, `TC_RG_03`, `TC_RG_04`, `TC_RG_05`, `TC_RG_07`
- Van de: request thieu/invalid input khong tra validation `400` sach va nhat quan
- Fix da ap dung:
  - Them Bean Validation cho `LoginRequest` va `RegisterRequest`
  - Them `@Valid` cho `AuthController.login()` va `AuthController.register()`
  - Chuan hoa `MethodArgumentNotValidException`
- Retest: pass

#### BUG-AUTH-BVA-02
- Pham vi: `register`
- Test case: `TC_RG_02`, `TC_RG_06`
- Van de: register thanh cong nhung tra `200 OK` thay vi `201 Created`
- Fix da ap dung:
  - `AuthController.register()` tra `ResponseEntity.status(HttpStatus.CREATED)`
- Retest: pass

#### BUG-AUTH-BVA-03
- Pham vi: `register`
- Test case: `TC_RG_08`
- Van de: duplicate email tra `400` thay vi `409`
- Fix da ap dung:
  - Them `DuplicateEmailException`
  - Map exception sang `409 Conflict`
- Retest: pass

#### BUG-AUTH-BVA-04
- Pham vi: `register -> login`
- Test case: `TC_RG_05 -> TC_LG_02`
- Van de: email sai dinh dang van duoc persist va xac thuc thanh cong
- Fix da ap dung:
  - Chan invalid email o `register` va `login`
  - Xoa du lieu invalid-email ton dong trong `auth_db.users`
- Retest: pass

#### BUG-AUTH-BVA-05
- Pham vi: `logout`
- Test case: `TC_LO_01`, `TC_LO_02`, `TC_LO_03`
- Van de: logout unauthorized tra `403` thay vi `401`
- Fix da ap dung:
  - Them `RestAuthenticationEntryPoint`
  - Cau hinh `SecurityConfig` dung entry point rieng
  - Cap nhat `JwtAuthenticationFilter` de chan som token invalid/expired/blacklisted
- Retest: pass

### Ket luan V1
- `F1-F3` hien khong con open bug trong `Testing/logbug.md`
- Moi thay doi cho `V2` va `V3` bat buoc chay regression lai `F1-F3`

## Version 2 - Closed After Fix

### Pham vi
- Function 4: `forgotPassword`
- Function 5: `changePassword`

### Canonical contract da khoa lai truoc khi chay
- `forgotPassword` phai dung `POST /api/auth/forgot-password?email=...`
- `TC_FP_03` expected theo code hien tai la `400 Bad Request`, khong dung `404`
- `changePassword` la protected endpoint, phai co `Authorization: Bearer <valid_token>`
- `TC_CP_02` expected theo code hien tai la `400 Bad Request`
- `TC_CP_04` duoc giu nguyen expected `400` de bat bug neu validation chua day du

### Ket qua Postman/Newman ngay 2026-04-18
- Discovery run: pass `7/10`, fail `3/10`
- Sau khi fix code va restart build moi: pass `10/10`

### Bug da fix trong V2

#### BUG-AUTH-V2-01
- Pham vi: `forgotPassword`
- Test case: `TC_FP_01`
- Van de: thieu `email` query param nhung endpoint tra `500` thay vi `400`
- Fix da ap dung:
  - Them handler cho `MissingServletRequestParameterException`
  - Khoa lai response `400` sach cho query param bat buoc
- Retest: pass

#### BUG-AUTH-V2-02
- Pham vi: `changePassword`
- Test case: `TC_CP_04`
- Van de: `newPassword=""` van duoc chap nhan va API tra `200 OK`
- Fix da ap dung:
  - Them Bean Validation cho `ChangePasswordRequest`
  - Them `@Valid` cho `AuthController.changePassword()`
  - Them check `confirmPassword` khop `newPassword` trong service
- Retest: pass

#### BUG-AUTH-V2-03
- Pham vi: `changePassword`
- Test case: `TC_CP_05`
- Van de: fail phu thuoc sau khi `TC_CP_04` lam hu state password
- Fix da ap dung:
  - Khong con side effect doi mat khau rong sau khi `BUG-AUTH-V2-02` duoc fix
  - Full suite `TC_CP_05` pass lai trong cung V2 run
- Retest: pass

### Ket luan V2
- `F4-F5` hien khong con open bug
- `V2` dat dieu kien release

### Tieu chi release V2
- `TC_FP_*` dung contract query param, khong con request-body drift
- `TC_CP_*` co JWT pre-condition ro rang
- Moi case fail deu co bug log, fix note, retest result, va version label
- Khong con open bug trong `F4-F5`

## Version 3 - Closed After Regression

### Pham vi
- Function 6: `securityFilterChain`
- Function 7: `doFilterInternal`

### Canonical contract da khoa lai truoc khi chay
- Bo hoan toan endpoint placeholder `/api/protected`
- Protected endpoint chuan cho security tests: `POST /api/auth/logout`
- Public endpoint chuan: `GET /api/auth/health`
- Missing header, invalid prefix, invalid JWT, expired JWT deu phai tra `401 Unauthorized`
- Valid token tren protected endpoint phai tra `200 OK`

### Rui ro da biet truoc khi chay
- `TC_SFC_03` va `TC_DFI_05` dung `logout` lam protected endpoint nen token se bi blacklist neu tai su dung
- Runner phai login lai de lay fresh token truoc moi valid-token case co side effect
- Test harness `auth-test-common.ps1` truoc do hardcode pattern `Active Queue` trong precheck canonicalization; da duoc sua de khong chan rerun tren tai lieu da cap nhat trang thai

### Tieu chi release V3
- `TC_SFC_*` va `TC_DFI_*` dung endpoint that
- Security response code khong mo ho
- Full regression `F1-F7` pass truoc khi release

### Ket qua Postman/Newman ngay 2026-04-19
- Pass `11/11` requests
- Pass `11/11` assertions
- Scope `securityFilterChain` va `doFilterInternal` hien khong mo bug moi tren contract da canonicalize
- Full regression tren cung branch cung pass:
  - `V1`: `18/18`
  - `V2`: `10/10`
  - `V3`: `11/11`

### Ket luan V3
- `F6-F7` hien khong co open bug san pham
- `V3` dat dieu kien release sau full regression `F1-F7`

## Mockdata Cleanup Cho Release
- Xoa seed sample `course_slot_packages` khoi `docker/init-db.sql`
- Thay `overallEffortScore = 8.5` hardcode bang gia tri tinh toan tu effort metrics trong `ai-service`
- Xoa fallback OpenAI `demo-key-to-prevent-startup-crash` va yeu cau cau hinh key hop le khi khoi dong `ai-service`
- Doi ten `mockUser` o frontend thanh display-state de bo logic mock tren layout
- Doi log `[MAIL MOCKED]` thanh log trung tinh theo config trong `auth-service`

## Ghi chu van hanh
- Runner chinh: `Postman/Newman`
- Wrapper scripts:
  - `Testing/scripts/v1-f1-f3.ps1`
  - `Testing/scripts/v2-f4-f5.ps1`
  - `Testing/scripts/v3-f6-f7.ps1`
- Common automation logic:
  - `Testing/scripts/auth-test-common.ps1`
- Script tao branch version:
  - `Testing/scripts/new-version-branches.ps1`
