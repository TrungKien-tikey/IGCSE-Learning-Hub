package com.igcse.ai.controller;

import com.igcse.ai.dto.aiChamDiem.AIResultResponse;
import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.service.AIService;
import com.igcse.ai.service.common.JsonService;
import com.igcse.ai.service.common.StudyContextService;
import com.igcse.ai.service.goiyLoTrinhHoc.IRecommendationService;
import com.igcse.ai.service.phanTich.IInsightService;

import com.igcse.ai.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
public class AIController {
    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    private final AIService aiService;
    private final IRecommendationService recommendationService;
    private final IInsightService insightService;
    private final JsonService jsonService;
    private final StudyContextService studyContextService;
    private final Executor taskExecutor;

    public AIController(
            AIService aiService,
            IRecommendationService recommendationService,
            IInsightService insightService,
            JsonService jsonService,
            StudyContextService studyContextService,
            @Qualifier("taskExecutor") Executor taskExecutor) {
        this.aiService = aiService;
        this.recommendationService = recommendationService;
        this.insightService = insightService;
        this.jsonService = jsonService;
        this.studyContextService = studyContextService;
        this.taskExecutor = taskExecutor;
    }

    @GetMapping("/result/{attemptId}")
    public ResponseEntity<?> getResult(@PathVariable Long attemptId) {
        logger.info("Get result request - attemptId: {}", attemptId);

        AIResult result = aiService.getResult(attemptId);

        // Kiểm tra quyền truy cập (Học sinh chỉ xem bài của mình, Teacher/Admin xem
        // hết)
        if (!SecurityUtils.canAccessStudentData(result.getStudentId())) {
            logger.warn("User {} attempted to access result for attempt {} of student {} without permission",
                    SecurityUtils.getCurrentUserId(), attemptId, result.getStudentId());
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Bạn không có quyền truy cập kết quả của học sinh này"));
        }

        AIResultResponse response = new AIResultResponse(result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/result/{attemptId}/details")
    public ResponseEntity<?> getDetailedResult(
            @PathVariable Long attemptId) {
        logger.info("Get detailed result request - attemptId: {}", attemptId);

        DetailedGradingResultDTO result = aiService.getDetailedResult(attemptId);

        // Kiểm tra quyền truy cập (Học sinh chỉ xem bài của mình, Teacher/Admin xem
        // hết)
        if (!SecurityUtils.canAccessStudentData(result.getStudentId())) {
            logger.warn("User {} attempted to access detailed result for attempt {} of student {} without permission",
                    SecurityUtils.getCurrentUserId(), attemptId, result.getStudentId());
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Bạn không có quyền truy cập kết quả của học sinh này"));
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ingest-context")
    @PreAuthorize("permitAll()") // Override class-level @PreAuthorize để cho phép NiFi gọi không cần auth
    public ResponseEntity<Map<String, String>> ingestContext(@RequestBody List<Map<String, Object>> records) {
        logger.info(">>> [NiFi-to-AI] Received {} records from NiFi", records.size());

        // BƯỚC 1: Lưu dữ liệu vào Database ngay lập tức (Persistence)
        studyContextService.saveContextFromNiFi(records);

        Set<Long> studentIds = new HashSet<>();
        for (Map<String, Object> record : records) {
            Object sid = record.get("user_id");
            if (sid == null)
                sid = record.get("studentId");

            if (sid != null) {
                Long studentId = Long.valueOf(sid.toString());
                studentIds.add(studentId);

                // Cập nhật course_id vào Database nếu có (không cần update điểm vì
                // exam_attempts đã có total_score)
                Object aid = record.get("attempt_id");
                if (aid != null) {
                    Long attemptId = Long.valueOf(aid.toString());
                    Long courseId = record.get("course_id") != null
                            ? Long.valueOf(record.get("course_id").toString())
                            : null;
                    // Chỉ update courseId vào AIResult nếu có
                    if (courseId != null) {
                        aiService.updateComponentScores(attemptId, null, null, courseId);
                    }
                }
            }
        }

        String content = jsonService.toJson(records);
        for (Long studentId : studentIds) {
            logger.info(">>> [NiFi-to-AI] Triggering async analysis for student: {}", studentId);
            processStudentAnalysisAsync(studentId, content);
        }

        Map<String, String> response = new HashMap<>();
        response.put("status", "ACCEPTED");
        response.put("message",
                "Ingestion queued for " + studentIds.size() + " students. Processing will continue asynchronously.");
        return ResponseEntity.accepted().body(response);
    }

    private void processStudentAnalysisAsync(Long studentId, String content) {
        CompletableFuture.runAsync(() -> {
            try {
                logger.info(">>> [Async] Processing recommendation for student: {}", studentId);
                recommendationService.triggerUpdate(studentId, content);

                logger.info(">>> [Async] Processing insight for student: {}", studentId);
                insightService.triggerUpdate(studentId, content);

                logger.info(">>> [Async] Completed analysis for student: {}", studentId);
            } catch (Exception e) {
                logger.error(">>> [Async] Error processing analysis for student {}: {}", studentId, e.getMessage(), e);
            }
        }, taskExecutor);
    }

    @GetMapping("/health")
    @PreAuthorize("permitAll()")
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
