-- Tạo database cho các Service
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS exam_db;
CREATE DATABASE IF NOT EXISTS course_db;
CREATE DATABASE IF NOT EXISTS ai_db;
CREATE DATABASE IF NOT EXISTS communication_db;

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
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_student_id (student_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_graded_at (graded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu phân tích (Insight)
CREATE TABLE IF NOT EXISTS ai_insights (
    insight_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    overall_summary TEXT,
    key_strengths TEXT COMMENT 'JSON array',
    areas_for_improvement TEXT COMMENT 'JSON array',
    action_plan TEXT,
    language VARCHAR(10) DEFAULT 'vi',
    is_ai_generated BOOLEAN DEFAULT TRUE,
    total_exams_analyzed INT,
    avg_score_analyzed DOUBLE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng lưu gợi ý (Recommendation)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    recommendation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    weak_topics TEXT COMMENT 'JSON array',
    strong_topics TEXT COMMENT 'JSON array',
    recommended_resources TEXT COMMENT 'JSON array',
    learning_path_suggestion TEXT,
    language VARCHAR(10) DEFAULT 'vi',
    is_ai_generated BOOLEAN DEFAULT TRUE,
    total_exams_analyzed INT,
    avg_score_analyzed DOUBLE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- Database cho Communication Service
-- ============================================================================
CREATE DATABASE IF NOT EXISTS communication_db;
USE communication_db;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50), 
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT, -- Null nếu là chat group/room.
    room_id VARCHAR(100), -- Room ID để gom nhóm tin nhắn
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'ID người dùng',
    exam_id BIGINT NOT NULL COMMENT 'ID bài thi',
    content TEXT NOT NULL COMMENT 'Nội dung bình luận',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo'
);
