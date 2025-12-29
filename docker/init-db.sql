-- Tạo database cho AI Service
CREATE DATABASE IF NOT EXISTS ai_db;
USE ai_db;

-- ============================================================================
-- Bảng lưu trữ kết quả chấm điểm từ AI
-- ============================================================================
-- 
-- THAM CHIẾU ĐẾN DATABASE exam_db:
-- - attempt_id → exam_db.exam_attempts.attempt_id
-- - exam_id → exam_db.exams.exam_id
-- - student_id → exam_db.exam_attempts.user_id
--
-- DỮ LIỆU CÂU HỎI VÀ CÂU TRẢ LỜI (từ exam_db):
-- - exam_db.questions: Câu hỏi
--   + question_id: ID câu hỏi
--   + content: Nội dung câu hỏi
--   + question_type: Loại câu hỏi ('MCQ' = Trắc nghiệm, 'ESSAY' = Tự luận)
--   + essay_correct_answer: Đáp án đúng cho câu tự luận (chỉ có khi question_type = 'ESSAY')
--
-- - exam_db.exam_answers: Câu trả lời của học sinh
--   + answer_id: ID câu trả lời
--   + attempt_id: ID lượt làm bài
--   + question_id: ID câu hỏi
--   + selected_option_id: ID lựa chọn đã chọn (NOT NULL = Trắc nghiệm/MCQ)
--   + text_answer: Văn bản câu trả lời (NOT NULL = Tự luận/ESSAY)
--   + score: Điểm đạt được
--
-- LƯU Ý:
-- - Không dùng FOREIGN KEY vì dữ liệu nằm ở database khác (exam_db)
-- - AI Service lấy dữ liệu từ Exam Service qua REST API, không query trực tiếp database
-- - Bảng này chỉ lưu KẾT QUẢ CHẤM ĐIỂM, không lưu câu hỏi hay câu trả lời
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_results (
    result_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT NOT NULL UNIQUE COMMENT 'Tham chiếu đến exam_db.exam_attempts.attempt_id',
    score DOUBLE NOT NULL COMMENT 'Điểm số tổng (0-10)',
    feedback TEXT COMMENT 'Nhận xét tổng quát từ AI',
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian chấm điểm',
    language VARCHAR(10) DEFAULT 'en' COMMENT 'Ngôn ngữ của feedback (en, vi)',
    confidence DOUBLE DEFAULT 1.0 COMMENT 'Độ tin cậy của điểm số (0.0-1.0)',
    student_id BIGINT COMMENT 'ID học sinh (từ exam_db.exam_attempts.user_id)',
    exam_id BIGINT COMMENT 'ID bài thi (từ exam_db.exams.exam_id)',
    details TEXT COMMENT 'JSON chứa chi tiết điểm từng câu (tham chiếu đến exam_db.exam_answers)',
    evaluation_method VARCHAR(50) DEFAULT 'LOCAL_RULE_BASED' COMMENT 'Phương pháp chấm: AI_GPT4_LANGCHAIN hoặc LOCAL_RULE_BASED',
    answers_hash VARCHAR(64) COMMENT 'MD5 hash của answers JSON để validate cache (tránh chấm lại khi answers không thay đổi)',
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_student_id (student_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_graded_at (graded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


