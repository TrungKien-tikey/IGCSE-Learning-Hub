package com.igcse.ai.dto.thongKe;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParentSummaryDTO {
    private Long studentId;
    private String studentName;

    // "Excellent", "Good", "Needs Attention", "At Risk"
    private String academicStatus;

    // E.g. "Score is trending up (+15%)", "Consistently high effort"
    private String trendSummary;

    // Critical alerts: "Low score on recent Math exam", "Rushed through last 2
    // exams"
    private List<String> recentAlerts;

    // Top 3 areas needing support
    private List<String> topWeaknesses;

    private Double overallEffortScore; // 0.0 - 10.0 scale based on duration vs expectations
}
