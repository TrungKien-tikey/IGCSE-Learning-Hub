package com.igcse.ai.controller;

import com.igcse.ai.dto.BatchGradingRequest;
import com.igcse.ai.dto.BatchGradingResponse;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.service.AIService;
import com.igcse.ai.service.grading.BatchGradingService;
import com.igcse.ai.service.common.LanguageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {
    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    @Autowired
    private AIService aiService;

    @Autowired
    private BatchGradingService batchGradingService;

    @PostMapping("/mark-exam/{attemptId}")
    public ResponseEntity<Map<String, Object>> markExam(
            @PathVariable Long attemptId,
            @RequestParam(value = "language", defaultValue = "auto") String language) {

        logger.info("Mark exam request - attemptId: {}, language: {}", attemptId, language);

        try {
            double score = aiService.evaluateExam(attemptId, language);
            Map<String, Object> response = new HashMap<>();
            response.put("attemptId", attemptId);
            response.put("score", score);
            response.put("passed", score >= 5.0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error marking exam for attemptId: {}", attemptId, e);
            throw e;
        }
    }

    @GetMapping("/result/{attemptId}")
    public ResponseEntity<AIResultResponse> getResult(@PathVariable Long attemptId) {
        logger.info("Get result request - attemptId: {}", attemptId);

        AIResult result = aiService.getResult(attemptId);
        AIResultResponse response = new AIResultResponse(result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/result/{attemptId}/details")
    public ResponseEntity<com.igcse.ai.dto.DetailedGradingResultDTO> getDetailedResult(@PathVariable Long attemptId) {
        logger.info("Get detailed result request - attemptId: {}", attemptId);

        com.igcse.ai.dto.DetailedGradingResultDTO result = aiService.getDetailedResult(attemptId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/batch/mark-exams")
    public ResponseEntity<Map<String, Object>> batchMarkExams(@RequestBody BatchGradingRequest request) {
        logger.info("Batch mark exams request - count: {}, language: {}",
                request.getAttemptIds() != null ? request.getAttemptIds().size() : 0,
                request.getLanguage());

        if (request.getAttemptIds() == null || request.getAttemptIds().isEmpty()) {
            logger.warn("Batch request with empty attemptIds");
            Map<String, Object> error = new HashMap<>();
            error.put("error", "attemptIds cannot be empty");
            return ResponseEntity.badRequest().body(error);
        }

        String language = request.getLanguage() != null ? request.getLanguage() : LanguageService.DEFAULT_LANGUAGE;
        String batchId = batchGradingService.createBatch(request.getAttemptIds(), language);

        Map<String, Object> response = new HashMap<>();
        response.put("batchId", batchId);
        response.put("status", "PROCESSING");
        response.put("totalAttempts", request.getAttemptIds().size());
        response.put("timestamp", System.currentTimeMillis());

        logger.info("Batch processing started - batchId: {}", batchId);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/batch/status/{batchId}")
    public ResponseEntity<BatchGradingResponse> getBatchStatus(@PathVariable String batchId) {
        logger.debug("Get batch status request - batchId: {}", batchId);

        BatchGradingResponse status = batchGradingService.getBatchStatus(batchId);

        if (status == null) {
            logger.warn("Batch not found - batchId: {}", batchId);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(status);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "AI Service");
        health.put("timestamp", System.currentTimeMillis());
        health.put("supportedLanguages", new String[] { "en", "vi" });
        health.put("features", new String[] { "multi-language", "confidence-score", "batch-processing" });
        return ResponseEntity.ok(health);
    }

    // ===== RESPONSE DTOs =====

    /**
     * DTO class cho response với confidence và language
     */
    public static class AIResultResponse {
        private Long resultId;
        private Long attemptId;
        private Double score;
        private String feedback;
        private java.util.Date gradedAt;
        private boolean passed;
        private String language;
        private Double confidence;
        private String confidenceLevel;
        private String evaluationMethod;

        public AIResultResponse() {
        }

        public AIResultResponse(AIResult result) {
            this.resultId = result.getResultId();
            this.attemptId = result.getAttemptId();
            this.score = result.getScore();
            this.feedback = result.getFeedback();
            this.gradedAt = result.getGradedAt();
            this.passed = result.isPassed();
            this.language = result.getLanguage();
            this.confidence = result.getConfidence();
            this.confidenceLevel = result.getConfidenceLevel();
            this.evaluationMethod = result.getEvaluationMethod();
        }

        // Getters and Setters
        public Long getResultId() {
            return resultId;
        }

        public void setResultId(Long resultId) {
            this.resultId = resultId;
        }

        public Long getAttemptId() {
            return attemptId;
        }

        public void setAttemptId(Long attemptId) {
            this.attemptId = attemptId;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

        public String getFeedback() {
            return feedback;
        }

        public void setFeedback(String feedback) {
            this.feedback = feedback;
        }

        public java.util.Date getGradedAt() {
            return gradedAt;
        }

        public void setGradedAt(java.util.Date gradedAt) {
            this.gradedAt = gradedAt;
        }

        public boolean isPassed() {
            return passed;
        }

        public void setPassed(boolean passed) {
            this.passed = passed;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public Double getConfidence() {
            return confidence;
        }

        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }

        public String getConfidenceLevel() {
            return confidenceLevel;
        }

        public void setConfidenceLevel(String confidenceLevel) {
            this.confidenceLevel = confidenceLevel;
        }

        public String getEvaluationMethod() {
            return evaluationMethod;
        }

        public void setEvaluationMethod(String evaluationMethod) {
            this.evaluationMethod = evaluationMethod;
        }
    }
}
