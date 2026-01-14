package com.igcse.ai.controller.goiyLoTrinhHoc;

import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;
import com.igcse.ai.service.ass.goiyLoTrinhHoc.IRecommendationService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/recommendations")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
public class RecommendationController {

    private final IRecommendationService recommendationService;

    public RecommendationController(IRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<LearningRecommendationDTO> getRecommendations(@PathVariable Long studentId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(studentId));
    }

    @PostMapping("/trigger/{studentId}")
    public ResponseEntity<String> triggerUpdate(
            @PathVariable Long studentId,
            @RequestBody(required = false) String nifiData) {
        recommendationService.triggerUpdate(studentId, nifiData);
        return ResponseEntity.ok("AI Recommendation update triggered with data for studentId: " + studentId);
    }
}
