Feature('Sửa khóa học (Update Course)');

const TARGET_COURSE_ID = 63; 

// Payload chuẩn để update
const validUpdatePayload = {
  title: "Khóa học IGCSE Toán học (Đã cập nhật V2)",
  description: "Nội dung bài giảng đã được update theo chuẩn năm 2026.",
  price: 650000,
  duration: "40 hours"
};

// =========================================================
// CHẠY TRƯỚC MỖI TEST CASE: Tự động đăng nhập
// =========================================================
Before(async ({ I }) => {
  
  await I.loginAsTeacher('kien@gmail.com', 'Kienz*123'); 
});

// =========================================================
// TC_UP_01: Happy Path - Sửa khóa học thành công
// =========================================================
Scenario('TC_UP_01: Cập nhật thông tin khóa học thành công với dữ liệu hợp lệ', ({ I }) => {
  // Gửi PUT request tới /courses/{id} (Kong sẽ tự nối thành /api/courses/77)
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}`, validUpdatePayload);
  
  // API của bạn sẽ trả về 200 OK
  I.seeResponseCodeIs(200); 
  
  // Kiểm tra xem dữ liệu JSON trả về đã đúng với thông tin mới chưa
  I.seeResponseContainsJson({
    courseId: TARGET_COURSE_ID,
    title: validUpdatePayload.title,
    price: validUpdatePayload.price
  });
});

// =========================================================
// TC_UP_02: Lỗi Phân Quyền (Không có Token)
// =========================================================
Scenario('TC_UP_02: Thất bại (401) khi gọi API sửa khóa học không có Token', ({ I }) => {
  // Xóa Token hiện tại
  I.clearAuth(); 
  
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}`, validUpdatePayload);
  
  // Mong đợi Gateway chặn lại và báo 401
  I.seeResponseCodeIs(401); 
});

// =========================================================
// TC_UP_03: Sửa khóa học không tồn tại (ID ảo)
// =========================================================
Scenario('TC_UP_03: Thất bại (404/400) khi sửa khóa học không có thực', ({ I }) => {
  const fakeId = 999999;
  
  I.sendPutRequest(`/courses/${fakeId}`, validUpdatePayload);
  
  // Tùy vào Backend của bạn ném Exception nào (thường là 404 Not Found hoặc 400 Bad Request)
  // Bạn có thể sửa số 404 dưới đây thành 400 nếu chạy test bị Fail
  I.seeResponseCodeIs(404); 
});

// =========================================================
// TC_UP_04: Lỗi Validation (Giá tiền bị âm)
// =========================================================
Scenario('TC_UP_04: Thất bại (400) khi nhập giá tiền bị âm', ({ I }) => {
  const invalidPayload = { ...validUpdatePayload, price: -100000 };
  
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}`, invalidPayload);
  
  // Spring Boot Validation @Min(0) sẽ bắt lỗi và trả về 400
  I.seeResponseCodeIs(400); 
});

// =========================================================
// TC_UP_05: Bảo mật Phân quyền - Sửa bài người khác
// =========================================================
Scenario('TC_UP_05: Thất bại (403) khi sửa khóa học của giáo viên khác', async ({ I }) => {
  // 1. Đăng nhập bằng một tài khoản giáo viên KHÁC (Teacher B)
  // (Lưu ý: Bạn cần tạo thêm 1 tài khoản này trong Database để test)
  await I.loginAsTeacher('KK@gmail.com', 'Kienz*123'); 
  
  // 2. Cố tình sửa khóa học (TARGET_COURSE_ID) do Teacher A (kien@gmail.com) tạo
  I.sendPutRequest(`/courses/${TARGET_COURSE_ID}`, validUpdatePayload);
  
  // 3. Hệ thống phải chặn lại và trả về 403 Forbidden (hoặc 400)
  I.seeResponseCodeIs(403); 
});