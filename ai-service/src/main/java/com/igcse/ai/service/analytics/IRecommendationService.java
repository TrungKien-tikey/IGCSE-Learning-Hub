package com.igcse.ai.service.analytics;

import com.igcse.ai.dto.LearningRecommendationDTO;

public interface IRecommendationService {
    LearningRecommendationDTO getRecommendations(Long studentId);
}
