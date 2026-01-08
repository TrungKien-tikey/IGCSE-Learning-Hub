package com.igsce.exam_service.dto;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
public class StartExamRequest {
    private Long examId;
    private Long userId;

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

}
