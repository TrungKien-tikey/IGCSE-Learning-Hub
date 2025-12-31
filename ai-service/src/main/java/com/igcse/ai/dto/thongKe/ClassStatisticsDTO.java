package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
    private int pendingAssignments;
    private List<StudentStatisticsDTO> topStudents;
    private List<String> commonWeaknesses;
}
