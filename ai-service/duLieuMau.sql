-- Script để reset dữ liệu cho attemptId = 1
-- Chạy script này trong MySQL để xóa và tạo lại dữ liệu

USE ai_db;

-- Xóa dữ liệu cũ (nếu có)
DELETE FROM ai_results WHERE attempt_id = 1;

-- Insert dữ liệu mới
INSERT INTO ai_results (
    attempt_id,
    score,
    feedback,
    graded_at,
    language,
    confidence,
    student_id,
    exam_id,
    details,
    evaluation_method
) VALUES (
    1,
    6.175213675213675,
    'Total score: 7,41 / 12,00 (61,8%)\n\nCorrect answers: 2 / 3\n\nGood! You understood most of the content.\n\nDetails per question:\n- Q1: 1,00 / 1,00 (Confidence: 100%) - Correct! You selected the right answer.\n- Q2: 0,00 / 1,00 (Confidence: 100%) - Wrong. The correct answer is C. Please review this topic.\n- Q3: 6,41 / 10,00 (Confidence: 73%) - Auto-graded. Focus on the main points of the question. Keep trying!\n',
    NOW(),
    'en',
    0.9102666666666667,
    1,
    1,
    '[]',
    'AI_GPT4_LANGCHAIN'
);

