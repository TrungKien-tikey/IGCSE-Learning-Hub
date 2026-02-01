package com.igcse.ai.service.goiyLoTrinhHoc;

import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;

public interface IRecommendationService {
    LearningRecommendationDTO getRecommendations(Long studentId);

    void triggerUpdate(Long studentId, String nifiData);
}
