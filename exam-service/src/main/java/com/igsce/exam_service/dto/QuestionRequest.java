package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.*;

import com.igsce.exam_service.enums.QuestionType;

@Data
public class QuestionRequest {
    private Long questionId;
    private String content;
    private Double score;
    private Integer orderIndex;

    // Enum: MCQ hoặc ESSAY
    private QuestionType questionType;

    // Field chứa chuỗi Base64 của ảnh
    private String image;

    // Đáp án tham khảo cho câu tự luận (chỉ dùng cho ESSAY)
    private String essayCorrectAnswer;

    // Danh sách các lựa chọn (chỉ dùng cho MCQ)
    private List<OptionRequest> options;
}
