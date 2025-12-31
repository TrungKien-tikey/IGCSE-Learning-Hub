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
}
