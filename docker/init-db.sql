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
    student_name VARCHAR(255) COMMENT 'Tên học sinh (đồng bộ từ auth_db)',
    exam_id BIGINT COMMENT 'ID bài thi (từ exam_db.exams.exam_id)',
    class_id BIGINT COMMENT 'ID lớp học (từ NiFi/Study Context)',
    details TEXT COMMENT 'JSON chứa chi tiết điểm từng câu',
    evaluation_method VARCHAR(50) DEFAULT 'LOCAL_RULE_BASED' COMMENT 'Phương pháp chấm: AI_GPT4_LANGCHAIN hoặc LOCAL_RULE_BASED',
    answers_hash VARCHAR(64) COMMENT 'MD5 hash của answers JSON để validate cache',
    multiple_choice_score DOUBLE COMMENT 'Điểm phần trắc nghiệm',
    essay_score DOUBLE COMMENT 'Điểm phần tự luận',
    
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_student_id (student_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_class_id (class_id),
    INDEX idx_graded_at (graded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Bảng lưu phân tích (Insight)
CREATE TABLE IF NOT EXISTS ai_insights (
    insight_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    class_id BIGINT COMMENT 'ID lớp học (cho Teacher Analytics)',
    overall_summary TEXT,
    key_strengths TEXT COMMENT 'JSON array',
    areas_for_improvement TEXT COMMENT 'JSON array',
    action_plan TEXT,
    student_name VARCHAR(255),
    language VARCHAR(10) DEFAULT 'vi',
    is_ai_generated BOOLEAN DEFAULT TRUE,
    total_exams_analyzed INT,
    avg_score_analyzed DOUBLE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng lưu gợi ý (Recommendation)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    recommendation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    class_id BIGINT COMMENT 'ID lớp học (cho Teacher Analytics)',
    weak_topics TEXT COMMENT 'JSON array',
    strong_topics TEXT COMMENT 'JSON array',
    recommended_resources TEXT COMMENT 'JSON array',
    learning_path_suggestion TEXT,
    student_name VARCHAR(255),
    language VARCHAR(10) DEFAULT 'vi',
    is_ai_generated BOOLEAN DEFAULT TRUE,
    total_exams_analyzed INT,
    avg_score_analyzed DOUBLE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng lưu trữ bối cảnh học tập (Study Context) từ NiFi
CREATE TABLE IF NOT EXISTS study_contexts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL UNIQUE,
    student_name VARCHAR(255),
    class_id BIGINT,
    course_title VARCHAR(255) COMMENT 'Tên khóa học (từ NiFi title)',
    persona TEXT COMMENT 'Đặc điểm tính cách và thói quen học tập',
    context_data TEXT COMMENT 'Dữ liệu JSON chi tiết từ NiFi (chuyên cần...)',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



USE ai_db;


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
    username VARCHAR(255) DEFAULT 'Học viên' COMMENT 'Tên hiển thị người dùng' ,
    exam_id BIGINT NOT NULL COMMENT 'ID bài thi',
    content TEXT NOT NULL COMMENT 'Nội dung bình luận',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo'
);

-- ============================================================================
-- Database cho Course Service
-- ============================================================================
CREATE DATABASE IF NOT EXISTS course_db;

-- ============================================================================
-- Database cho Payment Service (Thống kê tiền - Yêu cầu 6, 7, 8)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS payment_db;
USE payment_db;

-- ----------------------------------------------------------------------------
-- Bảng 1: Gói suất học (Admin bán cho Giáo viên)
-- Giáo viên cần mua suất học để có thể tạo khóa học
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_slot_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Tên gói (VD: Gói 5 khóa học)',
    description TEXT COMMENT 'Mô tả chi tiết gói',
    slot_count INT NOT NULL COMMENT 'Số suất học trong gói',
    price DECIMAL(15,2) NOT NULL COMMENT 'Giá bán (VNĐ)',
    duration_days INT DEFAULT 365 COMMENT 'Thời hạn sử dụng (ngày)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Còn bán không',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Bảng 2: Giao dịch mua suất học (Giáo viên mua từ Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slot_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL COMMENT 'ID giáo viên mua',
    teacher_name VARCHAR(255) COMMENT 'Tên giáo viên (denormalized)',
    package_id BIGINT NOT NULL COMMENT 'ID gói suất học',
    package_name VARCHAR(255) COMMENT 'Tên gói (denormalized)',
    slots_purchased INT NOT NULL COMMENT 'Số suất đã mua',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thanh toán',
    payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER' COMMENT 'BANK_TRANSFER, MOMO, VNPAY, CASH',
    payment_status VARCHAR(50) DEFAULT 'PENDING' COMMENT 'PENDING, COMPLETED, FAILED, REFUNDED',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'Thời gian hoàn thành thanh toán',
    notes TEXT COMMENT 'Ghi chú giao dịch',
    
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_package_id (package_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_date (transaction_date),
    FOREIGN KEY (package_id) REFERENCES course_slot_packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Bảng 3: Quản lý suất học của Giáo viên
-- Mỗi giáo viên có một record duy nhất
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL UNIQUE COMMENT 'ID giáo viên',
    teacher_name VARCHAR(255) COMMENT 'Tên giáo viên (denormalized)',
    total_slots INT DEFAULT 0 COMMENT 'Tổng suất đã mua',
    used_slots INT DEFAULT 0 COMMENT 'Số suất đã dùng (tạo khóa học)',
    available_slots INT DEFAULT 0 COMMENT 'Số suất còn lại',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_available_slots (available_slots)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Bảng 4: Giao dịch mua khóa học (Học sinh mua từ Giáo viên)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL COMMENT 'ID học sinh mua',
    student_name VARCHAR(255) COMMENT 'Tên học sinh (denormalized)',
    course_id BIGINT NOT NULL COMMENT 'ID khóa học',
    course_title VARCHAR(255) COMMENT 'Tên khóa học (denormalized)',
    teacher_id BIGINT NOT NULL COMMENT 'ID giáo viên bán',
    teacher_name VARCHAR(255) COMMENT 'Tên giáo viên (denormalized)',
    original_price DECIMAL(15,2) NOT NULL COMMENT 'Giá gốc khóa học',
    discount_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Số tiền giảm giá',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thực thanh toán',
    platform_fee_percent DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Phần trăm phí nền tảng',
    platform_fee DECIMAL(15,2) DEFAULT 0 COMMENT 'Phí nền tảng (Admin thu)',
    teacher_revenue DECIMAL(15,2) DEFAULT 0 COMMENT 'Doanh thu giáo viên nhận',
    payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER' COMMENT 'BANK_TRANSFER, MOMO, VNPAY, CASH',
    payment_status VARCHAR(50) DEFAULT 'PENDING' COMMENT 'PENDING, COMPLETED, FAILED, REFUNDED',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'Thời gian hoàn thành thanh toán',
    notes TEXT COMMENT 'Ghi chú giao dịch',
    
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_date_status (transaction_date, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Bảng 5: Bảng tổng hợp giao dịch (Cho Admin thống kê)
-- Gom tất cả giao dịch từ slot_transactions và course_transactions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL COMMENT 'SLOT_PURCHASE, COURSE_ENROLLMENT',
    reference_id BIGINT NOT NULL COMMENT 'ID tham chiếu (slot_transaction_id hoặc course_transaction_id)',
    buyer_id BIGINT NOT NULL COMMENT 'ID người mua',
    buyer_name VARCHAR(255) COMMENT 'Tên người mua',
    buyer_role VARCHAR(50) COMMENT 'TEACHER hoặc STUDENT',
    seller_id BIGINT COMMENT 'ID người bán (NULL = Admin)',
    seller_name VARCHAR(255) COMMENT 'Tên người bán',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Tổng số tiền giao dịch',
    platform_revenue DECIMAL(15,2) DEFAULT 0 COMMENT 'Doanh thu Admin',
    payment_method VARCHAR(50) COMMENT 'Phương thức thanh toán',
    payment_status VARCHAR(50) DEFAULT 'PENDING' COMMENT 'Trạng thái',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'Thời gian hoàn thành',
    description TEXT COMMENT 'Mô tả giao dịch',
    
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_type_date (transaction_type, transaction_date),
    INDEX idx_date_status (transaction_date, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Dữ liệu mẫu: Các gói suất học mặc định
-- ----------------------------------------------------------------------------
INSERT INTO course_slot_packages (name, description, slot_count, price, duration_days, is_active) VALUES
('Gói Khởi Đầu', 'Gói dành cho giáo viên mới, bao gồm 3 suất tạo khóa học', 3, 500000.00, 365, TRUE),
('Gói Tiêu Chuẩn', 'Gói phổ biến nhất, bao gồm 10 suất tạo khóa học', 10, 1500000.00, 365, TRUE),
('Gói Chuyên Nghiệp', 'Gói dành cho giáo viên chuyên nghiệp, bao gồm 25 suất tạo khóa học', 25, 3000000.00, 365, TRUE),
('Gói Không Giới Hạn', 'Gói không giới hạn số lượng khóa học trong 1 năm', 999, 10000000.00, 365, TRUE);