package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO cho thống kê học sinh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentStatisticsDTO {
    private Long studentId;
    private int totalExams;
    private double averageScore;
    private double highestScore;
    private double lowestScore;
    private Map<String, Double> subjectPerformance; // Môn học -> Điểm TB
    private double improvementRate; // Tỉ lệ cải thiện so với tháng trước
}
