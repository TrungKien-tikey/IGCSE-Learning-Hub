package com.igsce.exam_service.dto;

import lombok.Data;

@Data
public class ManualGradingRequest {
    private Long attemptId;
    private Long answerId;
    private Double score;      // Điểm giáo viên nhập
    private String feedback;   // Nhận xét của giáo viên
}