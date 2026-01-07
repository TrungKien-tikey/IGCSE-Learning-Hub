package com.igcse.ai.controller.goiyLoTrinhHoc;

import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;
import com.igcse.ai.service.ass.goiyLoTrinhHoc.IRecommendationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/recommendations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"})
public class RecommendationController {

    private final IRecommendationService recommendationService;


    public RecommendationController(IRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<LearningRecommendationDTO> getRecommendations(@PathVariable Long studentId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(studentId));
    }
}
