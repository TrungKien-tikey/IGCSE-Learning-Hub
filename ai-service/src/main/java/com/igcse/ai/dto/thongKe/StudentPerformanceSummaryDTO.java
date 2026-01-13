package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentPerformanceSummaryDTO {
    private Long studentId;
    private String studentName; // Lấy từ NiFi hoặc Service khác
    private Double averageScore;
    private Integer totalExams;
    private String trend; // "UP", "DOWN", "STABLE"
}
