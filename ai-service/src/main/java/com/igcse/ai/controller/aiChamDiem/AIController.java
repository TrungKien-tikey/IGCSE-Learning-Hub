package com.igcse.ai.controller.aiChamDiem;

import com.igcse.ai.dto.aiChamDiem.AIResultResponse;
import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.service.AIService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173",
        "http://localhost:5174", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174" })
@RequiredArgsConstructor
public class AIController {
    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    private final AIService aiService;

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
    public ResponseEntity<DetailedGradingResultDTO> getDetailedResult(
            @PathVariable Long attemptId) {
        logger.info("Get detailed result request - attemptId: {}", attemptId);

        DetailedGradingResultDTO result = aiService.getDetailedResult(attemptId);
        return ResponseEntity.ok(result);
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
}
