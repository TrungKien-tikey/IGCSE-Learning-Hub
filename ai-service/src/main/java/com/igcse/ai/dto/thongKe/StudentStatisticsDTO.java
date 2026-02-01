package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;
import java.util.Date;

/**
 * DTO cho thống kê học sinh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentStatisticsDTO {
    private Long studentId;
    private String studentName;
    private int totalExams;
    private double averageScore;
    private double highestScore;
    private double lowestScore;
    private Map<String, Double> subjectPerformance; // Môn học -> Điểm TB
    private double improvementRate; // Tỉ lệ cải thiện so với tháng trước

    /**
     * Đặc điểm tính cách và thói quen học tập (từ NiFi/StudyContext)
     * Dùng để hiển thị Persona Badge trên Dashboard
     */
    private String persona;

    private List<ExamStat> recentExams; // Danh sách các bài thi gần nhất

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ExamStat {
        private Long attemptId;
        private String examName;
        private Double totalScore;
        private Double mcScore;
        private Double essayScore;
        private Date date;
    }
}
