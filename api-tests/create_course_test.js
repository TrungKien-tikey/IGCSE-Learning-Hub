Feature('Tạo khóa học (Create Course)');

const validCoursePayload = {
  title: "Khóa học IGCSE Toán học cơ bản",
  description: "Nắm vững nền tảng Toán IGCSE theo chuẩn Cambridge.",
  price: 500000,
  subject: "Mathematics",
  level: "IGCSE"
};

// =========================================================
// CHẠY TRƯỚC MỖI TEST CASE: Tự động đăng nhập
// =========================================================
Before(async ({ I }) => {
  // Điền email và mật khẩu của một tài khoản Teacher có sẵn trong Database của bạn
  await I.loginAsTeacher('kien@gmail.com', 'Kienz*123'); 
});

// =========================================================
// TC_CR_01: Happy Path - Tạo khóa học thành công
// =========================================================
Scenario('TC_CR_01: Tạo khóa học thành công với dữ liệu hợp lệ', ({ I }) => {
  // KHÔNG CẦN gọi I.amBearerAuthenticated() ở đây nữa vì Before đã làm rồi
  I.sendPostRequest('/courses', validCoursePayload);
  
  I.seeResponseCodeIs(200);
  I.seeResponseContainsKeys(['courseId', 'title', 'status']); 
  I.seeResponseContainsJson({
    title: validCoursePayload.title,
    status: 'PENDING'
  });
});

// =========================================================
// T_CR_02: Lỗi Phân Quyền (Unauthorized)
// =========================================================
Scenario('TC_CR_02: Thất bại (401) khi tạo khóa học không có Token', ({ I }) => {
  // Xóa token vừa được set ở Before để giả lập chưa đăng nhập
  I.clearAuth(); 
  
  I.sendPostRequest('/courses', validCoursePayload);
  I.seeResponseCodeIs(401);
});

// =========================================================
// TC_CR_03: Lỗi Dữ Liệu Thiếu (Missing Fields)
// =========================================================
Scenario('TC_CR_03: Thất bại (400) khi gửi Payload thiếu tiêu đề (title)', ({ I }) => {
  const invalidPayload = { ...validCoursePayload };
  delete invalidPayload.title; 
  
  I.sendPostRequest('/courses', invalidPayload);
  I.seeResponseCodeIs(400); 
});

// =========================================================
// TC_CR_04: Lỗi Nghiệp Vụ (Business Logic)
// =========================================================
Scenario('TC_CR_04: Thất bại (400) khi giá khóa học (price) bị âm', ({ I }) => {
  const invalidPayload = { ...validCoursePayload, price: -50000 }; 
  
  I.sendPostRequest('/courses', invalidPayload);
  I.seeResponseCodeIs(400); 
});