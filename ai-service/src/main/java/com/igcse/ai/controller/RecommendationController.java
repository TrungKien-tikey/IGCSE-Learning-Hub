package com.igcse.ai.controller;

import com.igcse.ai.dto.LearningRecommendationDTO;
import com.igcse.ai.service.analytics.IRecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/recommendations")
public class RecommendationController {

    private final IRecommendationService recommendationService;

    @Autowired
    public RecommendationController(IRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<LearningRecommendationDTO> getRecommendations(@PathVariable Long studentId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(studentId));
    }
}
