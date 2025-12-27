package com.igcse.ai.service.analytics;

import com.igcse.ai.dto.LearningRecommendationDTO;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class RecommendationService implements IRecommendationService {

    @Override
    public LearningRecommendationDTO getRecommendations(Long studentId) {
        // Mock data based on FE
        LearningRecommendationDTO rec = new LearningRecommendationDTO();
        rec.setStudentId(studentId);
        rec.setWeakTopics(Arrays.asList("Vật lý - Định luật Newton", "Toán - Hình học không gian"));
        rec.setStrongTopics(Arrays.asList("Toán - Đại số", "Hóa học - Hữu cơ"));
        rec.setRecommendedResources(Arrays.asList("Video: Ôn tập Vật lý chương 2", "Bài tập: Hình học nâng cao"));
        rec.setLearningPathSuggestion("Bạn nên tập trung vào Vật lý trong tuần này để cải thiện điểm số.");
        return rec;
    }
}
