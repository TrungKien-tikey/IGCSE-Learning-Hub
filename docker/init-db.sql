-- Tạo database cho AI Service
CREATE DATABASE IF NOT EXISTS ai_db;
USE ai_db;

-- Bảng lưu trữ bài làm (cache hoặc local storage)
CREATE TABLE IF NOT EXISTS exam_attempts (
    attempt_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answers TEXT COMMENT 'JSON string chứa danh sách câu trả lời'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu trữ kết quả chấm điểm từ AI
CREATE TABLE IF NOT EXISTS ai_results (
    result_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT NOT NULL UNIQUE,
    score DOUBLE NOT NULL,
    feedback TEXT COMMENT 'Nhận xét tổng quát từ AI',
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    language VARCHAR(10) DEFAULT 'en',
    confidence DOUBLE DEFAULT 1.0,
    student_id BIGINT,
    exam_id BIGINT,
    details TEXT COMMENT 'JSON chứa chi tiết điểm từng câu',
    CONSTRAINT fk_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(attempt_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
