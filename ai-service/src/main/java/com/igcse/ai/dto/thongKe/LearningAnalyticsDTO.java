package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningAnalyticsDTO {
    private Long studentId;
    private List<CurvePoint> learningCurve;
    private List<EffortPoint> effortMetrics;
    private List<BehaviorFlag> flags;

    @Data
    @AllArgsConstructor
    public static class CurvePoint {
        private Date date;
        private Double score;
        private String examTitle; // Optional: "Exam #123"
    }

    @Data
    @AllArgsConstructor
    public static class EffortPoint {
        private Long attemptId;
        private Double score;
        private Integer durationSeconds;
        private Integer expectedDurationSeconds; // Optional benchmark
    }

    @Data
    @AllArgsConstructor
    public static class BehaviorFlag {
        private String type; // "RUSHED", "STRUGGLING", "CONSISTENT"
        private String message;
        private String severity; // "HIGH", "MEDIUM", "LOW"
    }
}
