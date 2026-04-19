Feature('Xét duyệt khóa học (Approve Course)');

const TARGET_COURSE_ID = 63; // ID khóa học cần duyệt

Before(async ({ I }) => {
  await I.loginAsTeacher('T@gmail.com', 'Kienz*123'); 
});

// =========================================================
// TC_APP_01: Happy Path - Duyệt khóa học thành công
// =========================================================
Scenario('TC_APP_01: Duyệt khóa học thành công với tài khoản Admin/Manager', ({ I }) => {
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}/approve`);
  
  // Chỉ cần kiểm tra mã 200 là đủ vì backend trả về chuỗi String
  I.seeResponseCodeIs(200); 
  
});

// =========================================================
// TC_APP_02: Lỗi Phân Quyền (Không có Token)
// =========================================================
Scenario('TC_APP_02: Thất bại (401) khi không có Token xác thực', ({ I }) => {
  I.clearAuth(); 
  
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}/approve`);
  I.seeResponseCodeIs(401); 
});

// =========================================================
// TC_APP_03: Bảo mật Role - Teacher cố tình duyệt bài
// =========================================================
Scenario('TC_APP_03: Thất bại (403) khi Role không phải MANAGER/ADMIN', async ({ I }) => {
  // Đăng nhập bằng tài khoản chỉ có role TEACHER (Bạn thay email tương ứng vào đây)
  await I.loginAsTeacher('kien@gmail.com', 'Kienz*123'); 
  
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}/approve`);
  
  // Theo đúng code Java, nếu role khác MANAGER/ADMIN sẽ trả về 403
  I.seeResponseCodeIs(403); 
});

// =========================================================
// TC_APP_04: Duyệt khóa học không tồn tại
// =========================================================
Scenario('TC_APP_04: Thất bại (404) khi duyệt khóa học không có thực', ({ I }) => {
  const fakeCourseId = 999999;
  
  I.sendPutRequest(`/courses/${fakeCourseId}/approve`);
  
  // Theo code Java: ResponseEntity.notFound().build() -> Trả về 404
  I.seeResponseCodeIs(404); 
});