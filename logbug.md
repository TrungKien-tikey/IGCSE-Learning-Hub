# Log Bug Tasks - Function 1 to 7

File này thay cho Excel để theo dõi task test BVA và log bug cho `function1` đến `function7`.

## Quy ước dùng file
- Dùng `{{auth_base}}` theo [postman_collection.json](/c:/Users/Phat/OneDrive/Máy tính/KCPM/IGCSE-Learning-Hub/postman_collection.json:270), mặc định hiện tại là `http://localhost:8088`.
- Với các test yêu cầu token:
  - `valid_token`: lấy từ login thành công.
  - `invalid_token`: token JWT sai chữ ký / random string.
  - `expired_token`: token hết hạn.
  - `malformed_token`: token sai format.
- Với các test `protected endpoint`:
  - Nếu project không có `GET /api/protected`, thay bằng một endpoint bảo vệ có thật như:
    - `POST {{auth_base}}/api/auth/logout`
    - `POST {{auth_base}}/api/auth/change-password`
- Khi `Actual Result != Expected Result`, tạo 1 dòng mới ở phần `Bug Log`.
- Sau khi dev fix, cập nhật `Status`, `Fixed In Version`, `Retest Result`.

## Test Cycle
- Current Test Version:
- Retest Version:
- Tester:
- Test Date:

## Pre-check
- [ ] Start infra và auth-service.
- [ ] Xác nhận `auth_base = http://localhost:8088`.
- [ ] Chuẩn bị account test hợp lệ: `user5@example.com / abc321`.
- [ ] Chuẩn bị 1 email đã tồn tại để test duplicate register: `user4@example.com`.
- [ ] Chuẩn bị token hợp lệ từ login thành công.
- [ ] Chuẩn bị token expired và token invalid để test auth filter.

## Function 1 - login
Phạm vi: `AuthController.login`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_LG_01 | Thiếu `email` | `400 Bad Request` | `POST {{auth_base}}/api/auth/login` body: `{"password":"abc321"}` |
| [ ] | TC_LG_02 | `email` sai format | `400 Bad Request` | `POST {{auth_base}}/api/auth/login` body: `{"email":"user5example.com","password":"abc321"}` |
| [ ] | TC_LG_03 | `email` hợp lệ + password đúng | `200 OK` | `POST {{auth_base}}/api/auth/login` body: `{"email":"user5@example.com","password":"abc321"}` |
| [ ] | TC_LG_04 | Thiếu `password` | `400 Bad Request` | `POST {{auth_base}}/api/auth/login` body: `{"email":"user5@example.com"}` |
| [ ] | TC_LG_05 | `password` sai | `401 Unauthorized` | `POST {{auth_base}}/api/auth/login` body: `{"email":"user5@example.com","password":"wrongpass"}` |
| [ ] | TC_LG_06 | `password` rỗng | `400 Bad Request` | `POST {{auth_base}}/api/auth/login` body: `{"email":"user5@example.com","password":""}` |

## Function 2 - register
Phạm vi: `AuthController.register`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_RG_01 | `fullName` rỗng, nhỏ hơn min | `400 Bad Request` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"","email":"user+1@example.com","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_02 | `fullName` tại min = 1 ký tự | `201 Created` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"A","email":"user+2@example.com","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_03 | `fullName` vượt max | `400 Bad Request` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"<256chars>","email":"user+3@example.com","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_04 | Thiếu `email` | `400 Bad Request` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"Test User","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_05 | `email` sai format | `400 Bad Request` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"Test User","email":"userexample.com","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_06 | `email` tại max hợp lệ | `201 Created` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"Test User","email":"<254-char email>","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_07 | `email` vượt max | `400 Bad Request` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"Test User","email":"<255+ char email>","password":"Passw0rd!","role":"STUDENT"}` |
| [ ] | TC_RG_08 | `email` trùng | `409 Conflict` | `POST {{auth_base}}/api/auth/register` body: `{"fullName":"Test User","email":"user4@example.com","password":"Passw0rd!","role":"STUDENT"}` |

## Function 3 - logout
Phạm vi: `AuthController.logout`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_LO_01 | Thiếu access token | `401 Unauthorized` | `POST {{auth_base}}/api/auth/logout` header: `Authorization: (omit)` |
| [ ] | TC_LO_02 | Token không hợp lệ / sai format | `401 Unauthorized` | `POST {{auth_base}}/api/auth/logout` header: `Authorization: Bearer malformed_token` |
| [ ] | TC_LO_03 | Token hết hạn | `401 Unauthorized` | `POST {{auth_base}}/api/auth/logout` header: `Authorization: Bearer expired_token` |
| [ ] | TC_LO_04 | Token hợp lệ | `200 OK` | `POST {{auth_base}}/api/auth/logout` header: `Authorization: Bearer valid_token` |

## Function 4 - forgotPassword
Phạm vi: `AuthController.forgotPassword`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_FP_01 | Thiếu `email` | `400 Bad Request` | `POST {{auth_base}}/api/auth/forgot-password` body: `{}` |
| [ ] | TC_FP_02 | `email` sai format | `400 Bad Request` | `POST {{auth_base}}/api/auth/forgot-password` body: `{"email":"userexample.com"}` |
| [ ] | TC_FP_03 | `email` không tồn tại | `404 Not Found` | `POST {{auth_base}}/api/auth/forgot-password` body: `{"email":"notfound@example.com"}` |
| [ ] | TC_FP_04 | `email` hợp lệ tồn tại | `200 OK` | `POST {{auth_base}}/api/auth/forgot-password` body: `{"email":"user5@example.com"}` |

## Function 5 - changePassword
Phạm vi: `AuthController.changePassword`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_CP_01 | Thiếu `oldPassword` | `400 Bad Request` | `POST {{auth_base}}/api/auth/change-password` body: `{"newPassword":"abc123456"}` |
| [ ] | TC_CP_02 | `oldPassword` sai | `401 Unauthorized` | `POST {{auth_base}}/api/auth/change-password` body: `{"oldPassword":"wrongOldPass","newPassword":"abc123456"}` |
| [ ] | TC_CP_03 | Thiếu `newPassword` | `400 Bad Request` | `POST {{auth_base}}/api/auth/change-password` body: `{"oldPassword":"abc321"}` |
| [ ] | TC_CP_04 | `newPassword` rỗng | `400 Bad Request` | `POST {{auth_base}}/api/auth/change-password` body: `{"oldPassword":"abc321","newPassword":""}` |
| [ ] | TC_CP_05 | Đổi mật khẩu hợp lệ | `200 OK` | `POST {{auth_base}}/api/auth/change-password` body: `{"oldPassword":"abc321","newPassword":"abc123456"}` |
- [ ] Retest login bằng mật khẩu mới sau khi `TC_CP_05` pass.
- [ ] Retest login bằng mật khẩu cũ phải fail sau khi `TC_CP_05` pass.

## Function 6 - securityFilterChain
Phạm vi: `SecurityConfig.securityFilterChain`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_SFC_01 | Truy cập endpoint bảo vệ không có token | `401 Unauthorized` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: (omit)` |
| [ ] | TC_SFC_02 | Truy cập endpoint bảo vệ với token sai | `401 Unauthorized` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: Bearer invalid_token` |
| [ ] | TC_SFC_03 | Truy cập endpoint bảo vệ với token hợp lệ | `200 OK` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: Bearer valid_token` |
| [ ] | TC_SFC_04 | Truy cập endpoint public không cần auth | `200 OK` | `POST {{auth_base}}/api/auth/login` body: `{"email":"user5@example.com","password":"abc321"}` |

## Function 7 - doFilterInternal
Phạm vi: `JwtAuthenticationFilter.doFilterInternal`

| Done | Task ID | Scenario | Expected | Request |
| --- | --- | --- | --- | --- |
| [ ] | TC_DFI_01 | Không gửi header `Authorization` | `401 Unauthorized` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: (omit)` |
| [ ] | TC_DFI_02 | Sai prefix `Bearer` | `401 Unauthorized` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: Token abc123` |
| [ ] | TC_DFI_03 | JWT không hợp lệ | `401 Unauthorized` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: Bearer invalid_jwt_token` |
| [ ] | TC_DFI_04 | JWT hết hạn | `401 Unauthorized` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: Bearer expired_jwt_token` |
| [ ] | TC_DFI_05 | JWT hợp lệ | `200 OK` | `GET {{auth_base}}/api/protected` hoặc endpoint bảo vệ tương đương, header: `Authorization: Bearer valid_jwt_token` |
- [ ] Kiểm tra whitelist thực tế: `/api/auth/login`, `/api/auth/register`, `/api/auth/health`, `/api/auth/check-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/refresh-token`, `/swagger-ui`, `/v3/api-docs`, `/actuator`, `/error`.
- [ ] Kiểm tra token đã logout có còn đi qua filter được hay không.

## Bug Log
Điền thêm 1 dòng mỗi khi có mismatch giữa `Expected` và `Actual`.

| Bug ID | Function | Test Case | Version Detected | Severity | Priority | Expected | Actual | Request / Payload | Evidence | Status | Assignee | Fixed In Version | Retest Result | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | F01 login |  |  |  |  |  |  |  |  | Open |  |  |  |  |

## Severity Rule
- `Critical`: chặn login/logout/auth flow chính, gây 500 hoặc không thể test tiếp.
- `Major`: sai status code, sai validation chính, security rule sai.
- `Minor`: message sai, response format lệch nhẹ nhưng core flow vẫn chạy.

## Exit Checklist
- [ ] Hoàn thành toàn bộ task từ `TC_LG_01` đến `TC_DFI_05`.
- [ ] Tất cả bug đã có `Bug ID`.
- [ ] Tất cả bug đã có `Version Detected`.
- [ ] Các bug đã fix có `Fixed In Version` và `Retest Result`.
- [ ] Tổng hợp danh sách bug open trước khi chốt release.
