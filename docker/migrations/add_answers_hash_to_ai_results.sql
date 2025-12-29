-- Migration: Add answers_hash column to ai_results table
-- Date: 2025-01-XX
-- Description: Thêm column answers_hash để validate cache khi check đã chấm điểm chưa

USE ai_db;

-- Thêm column answers_hash vào bảng ai_results
ALTER TABLE ai_results 
ADD COLUMN answers_hash VARCHAR(64) NULL 
COMMENT 'MD5 hash của answers JSON để validate cache';

-- Tạo index để tối ưu query (optional, nhưng có thể hữu ích nếu cần search by hash)
-- CREATE INDEX idx_answers_hash ON ai_results(answers_hash);

-- Kiểm tra column đã được thêm
DESCRIBE ai_results;

