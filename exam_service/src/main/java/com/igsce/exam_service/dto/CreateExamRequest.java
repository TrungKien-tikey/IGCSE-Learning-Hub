package com.igsce.exam_service.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.igsce.exam_service.enums.QuestionType; // Nhớ import Enum của bạn

@Data
public class CreateExamRequest {
    
    // --- Các field của Exam ---
    private String title;
    private String description;
    private int duration;
    private LocalDateTime endTime;

    // Field này quan trọng để set trạng thái bài thi (Frontend có gửi lên)
    @JsonProperty("isActive")
    private boolean isActive; 

    // Danh sách câu hỏi
    private List<QuestionRequest> questions;

}