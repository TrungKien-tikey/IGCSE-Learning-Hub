Feature('Thêm bài học (Add Lesson)');

// -------------------------------------------------------------
// BIẾN TOÀN CỤC
// -------------------------------------------------------------
const TARGET_COURSE_ID = 63; // ID khóa học mà bạn có quyền sở hữu

const validLessonPayload = {
  title: "Bài 1: Giới thiệu tổng quan về Toán IGCSE",
  description: "Nắm được cấu trúc đề thi và các chủ đề trọng tâm.",
  videoUrl: "https://youtube.com/watch?v=ví_dụ",
  orderIndex: 1 // Thứ tự bài học
};

// =========================================================
// CHẠY TRƯỚC MỖI TEST CASE: Tự động đăng nhập
// =========================================================
Before(async ({ I }) => {
  await I.loginAsTeacher('kien@gmail.com', 'Kienz*123'); 
});

// =========================================================
// TC_LESSON_01: Happy Path - Thêm bài học thành công
// =========================================================
Scenario('TC_LESSON_01: Thêm bài học thành công vào khóa học hợp lệ', ({ I }) => {
  // Gửi POST request tới /courses/{courseId}/lessons
  I.sendPostRequest(`/courses/${TARGET_COURSE_ID}/lessons`, validLessonPayload);
  
  // API có thể trả về 200 (OK) hoặc 201 (Created)
  I.seeResponseCodeIs(200); 
  
  I.seeResponseContainsKeys(['lessonId', 'title', 'videoUrl']); 
  I.seeResponseContainsJson({
    title: validLessonPayload.title,
    orderIndex: validLessonPayload.orderIndex
  });
});

// =========================================================
// TC_LESSON_02: Lỗi Phân Quyền (Không có Token)
// =========================================================
Scenario('TC_LESSON_02: Thất bại (401) khi không có Token xác thực', ({ I }) => {
  I.clearAuth(); 
  I.sendPostRequest(`/courses/${TARGET_COURSE_ID}/lessons`, validLessonPayload);
  I.seeResponseCodeIs(401); 
});

// =========================================================
// TC_LESSON_03: Thêm bài học vào Khóa học không tồn tại
// =========================================================
Scenario('TC_LESSON_03: Thất bại (404/400) khi khóa học (Course ID) không tồn tại', ({ I }) => {
  const fakeCourseId = 999999;
  I.sendPostRequest(`/courses/${fakeCourseId}/lessons`, validLessonPayload);
  
  // Mong đợi hệ thống báo lỗi không tìm thấy khóa học gốc
  I.seeResponseCodeIs(404); 
});

// =========================================================
// TC_LESSON_04: Lỗi Validation (Thiếu tên bài học)
// =========================================================
Scenario('TC_LESSON_04: Thất bại (400) khi payload thiếu tiêu đề (title)', ({ I }) => {
  const invalidPayload = { ...validLessonPayload };
  delete invalidPayload.title; // Cố tình xóa title
  
  I.sendPostRequest(`/courses/${TARGET_COURSE_ID}/lessons`, invalidPayload);
  I.seeResponseCodeIs(400); 
});

// =========================================================
// TC_LESSON_05: Bảo mật Phân quyền - Thêm bài vào khóa của người khác
// =========================================================
Scenario('TC_LESSON_05: Thất bại (403) khi thêm bài học vào khóa học của Giáo viên khác', async ({ I }) => {
  // Đăng nhập bằng tài khoản Teacher khác
  await I.loginAsTeacher('KK@gmail.com', 'Kienz*123'); 
  
  I.sendPostRequest(`/courses/${TARGET_COURSE_ID}/lessons`, validLessonPayload);
  
  // Đảm bảo hệ thống chặn không cho giáo viên này thao tác lên khóa học của người khác
  I.seeResponseCodeIs(403); 
});