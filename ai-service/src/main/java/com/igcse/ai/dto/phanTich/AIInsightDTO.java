package com.igcse.ai.dto.phanTich;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho phân tích AI về học sinh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIInsightDTO {
    private Long studentId;
    private String overallSummary; // Nhận xét tổng quan (ngôn ngữ tự nhiên)
    private List<String> keyStrengths;
    private List<String> areasForImprovement;
    private String actionPlan;
}
