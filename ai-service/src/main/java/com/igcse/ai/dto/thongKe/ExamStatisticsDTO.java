package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO cho thống kê bài kiểm tra (trong phạm vi một lớp học)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamStatisticsDTO {
    private Long examId;
    private Long classId;
    private String examTitle; // Optional, if enriched
    private int submittedCount; // Số học sinh đã nộp/làm bài
    private int gradedCount; // Số bài đã chấm
    private double averageScore;
    private List<StudentPerformanceSummaryDTO> topStudents;
    private List<StudentPerformanceSummaryDTO> atRiskStudents;
    private Map<String, Integer> scoreDistribution; // "Excellent", "Good", "Average", "Below"
}
