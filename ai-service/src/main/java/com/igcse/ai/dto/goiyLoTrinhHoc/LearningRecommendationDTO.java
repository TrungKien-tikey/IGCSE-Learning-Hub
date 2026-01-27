package com.igcse.ai.dto.goiyLoTrinhHoc;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho gợi ý lộ trình học tập
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningRecommendationDTO {
    private Long studentId;
    private List<String> weakTopics;
    private List<String> strongTopics;
    private List<String> recommendedResources;
    private String learningPathSuggestion;

    /**
     * Lộ trình học tập theo cấu trúc bước (Smart Roadmap)
     */
    private List<RoadmapStep> roadmapSteps;

    /**
     * Một bước trong lộ trình học tập
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapStep {
        private int stepNumber;
        private String title;
        private String description;
        private String duration; // VD: "1 tuần", "3 ngày"
        private List<String> activities;
    }
}
