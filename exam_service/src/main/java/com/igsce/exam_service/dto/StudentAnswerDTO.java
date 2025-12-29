package com.igsce.exam_service.dto;

import lombok.*;

// DTO để hứng dữ liệu từ React khi nộp bài
@Data
public class StudentAnswerDTO {
    private Long questionId;
    private Long selectedOptionId; // Null nếu là tự luận
    private String textAnswer;     // Null nếu là trắc nghiệm
}