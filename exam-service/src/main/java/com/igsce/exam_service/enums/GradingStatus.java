package com.igsce.exam_service.enums;

public enum GradingStatus {
    PENDING,        // Mới nộp bài, chưa chấm
    AI_GRADED,      // AI đã chấm xong, chờ giáo viên duyệt (đối với bài có câu tự luận)
    COMPLETED       // Giáo viên đã duyệt hoặc bài chỉ có trắc nghiệm (đã chốt điểm)
}