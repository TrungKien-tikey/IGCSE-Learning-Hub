package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.*;

import com.igsce.exam_service.enums.QuestionType;

@Data
public class QuestionRequest {
    private String content;
    private Double score;
    private Integer orderIndex;
        
    // Enum: MCQ hoặc ESSAY
    private QuestionType questionType; 
        
    // Field chứa chuỗi Base64 của ảnh
    private String image; 
        
    // Danh sách các lựa chọn (chỉ dùng cho MCQ)
    private List<OptionRequest> options;
}
