package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO cho thống kê lớp học
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassStatisticsDTO {
    private Long classId;
    private String className;
    private int totalStudents;
    private double classAverageScore;
    private int completedAssignments;
    private List<StudentPerformanceSummaryDTO> topStudents;
    private List<StudentPerformanceSummaryDTO> atRiskStudents;
    private Map<String, Integer> scoreDistribution; // "Excellent", "Good", "Average", "Below"
    private Double improvementRate;
}
