package com.igcse.ai.controller.aiChamDiem;

import com.igcse.ai.service.ass.goiyLoTrinhHoc.IRecommendationService;
import com.igcse.ai.service.ass.phanTich.IInsightService;
import com.igcse.ai.dto.aiChamDiem.AIResultResponse;
import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.service.AIService;
import com.igcse.ai.service.common.JsonService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class AIController {
    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    private final AIService aiService;
    private final IRecommendationService recommendationService;
    private final IInsightService insightService;
    private final JsonService jsonService;

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

    @PostMapping("/ingest-context")
    public ResponseEntity<Map<String, String>> ingestContext(@RequestBody List<Map<String, Object>> records) {
        logger.info(">>> [NiFi-to-AI] Received {} records from NiFi", records.size());

        Set<Long> studentIds = new HashSet<>();
        for (Map<String, Object> record : records) {
            Object sid = record.get("user_id");
            if (sid == null)
                sid = record.get("studentId");

            if (sid != null) {
                Long studentId = Long.valueOf(sid.toString());
                studentIds.add(studentId);

                // Cập nhật điểm thành phần vào Database nếu có
                Object aid = record.get("attempt_id");
                if (aid != null) {
                    Long attemptId = Long.valueOf(aid.toString());
                    Double mcScore = record.get("mc_score") != null ? Double.valueOf(record.get("mc_score").toString())
                            : null;
                    Double essayScore = record.get("essay_score") != null
                            ? Double.valueOf(record.get("essay_score").toString())
                            : null;
                    Long classId = record.get("class_id") != null
                            ? Long.valueOf(record.get("class_id").toString())
                            : null;
                    aiService.updateComponentScores(attemptId, mcScore, essayScore, classId);
                }
            }
        }

        String content = jsonService.toJson(records);
        for (Long studentId : studentIds) {
            logger.info(">>> [NiFi-to-AI] Triggering analysis for student: {}", studentId);
            recommendationService.triggerUpdate(studentId, content);
            insightService.getInsight(studentId, content);
        }

        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Ingestion processed for " + studentIds.size() + " students");
        return ResponseEntity.ok(response);
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
