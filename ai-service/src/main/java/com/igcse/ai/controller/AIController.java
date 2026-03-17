package com.igcse.ai.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.igcse.ai.dto.aiChamDiem.AIResultResponse;
import com.igcse.ai.dto.aiChamDiem.AnswerDTO;
import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.dto.aiChamDiem.ExamAnswersDTO;
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
import org.springframework.http.HttpStatus;
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
    private final ObjectMapper objectMapper; // Dùng để parse JSON answers từ NiFi

    public AIController(
            AIService aiService,
            IRecommendationService recommendationService,
            IInsightService insightService,
            JsonService jsonService,
            StudyContextService studyContextService,
            ObjectMapper objectMapper,
            @Qualifier("taskExecutor") Executor taskExecutor) {
        this.aiService = aiService;
        this.recommendationService = recommendationService;
        this.insightService = insightService;
        this.jsonService = jsonService;
        this.studyContextService = studyContextService;
        this.objectMapper = objectMapper;
        this.taskExecutor = taskExecutor;
    }

    @GetMapping("/result/{attemptId}")
    public ResponseEntity<?> getResult(@PathVariable Long attemptId) {
        try {
            logger.info("Get result request - attemptId: {}", attemptId);
            AIResult result = aiService.getResult(attemptId);

            if (result == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "AI đang xử lý hoặc không tìm thấy kết quả bài thi này"));
            }

            String currentRole = SecurityUtils.getCurrentUserRole();
            Long currentUserId = SecurityUtils.getCurrentUserId();

            if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
                if (!result.getStudentId().equals(currentUserId)) {
                    logger.warn("Student {} attempted to view result of Student {}", currentUserId, result.getStudentId());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Bạn không có quyền truy cập kết quả của học sinh này"));
                }
            } else {
                if (!SecurityUtils.canAccessStudentData(result.getStudentId())) {
                    logger.warn("User {} attempted to access result for attempt {} of student {} without permission",
                            currentUserId, attemptId, result.getStudentId());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Bạn không có quyền truy cập kết quả của học sinh này"));
                }
            }

            AIResultResponse response = new AIResultResponse(result);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error retrieving AI result: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Hệ thống gặp sự cố khi tải điểm"));
        }
    }

    @GetMapping("/result/{attemptId}/details")
    public ResponseEntity<?> getDetailedResult(@PathVariable Long attemptId) {
        try {
            logger.info("Get detailed result request - attemptId: {}", attemptId);
            DetailedGradingResultDTO result = aiService.getDetailedResult(attemptId);

            if (result == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Không tìm thấy chi tiết bài thi này"));
            }

            String currentRole = SecurityUtils.getCurrentUserRole();
            Long currentUserId = SecurityUtils.getCurrentUserId();

            if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
                if (!result.getStudentId().equals(currentUserId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Bạn không có quyền xem chi tiết bài của người khác"));
                }
            } else {
                if (!SecurityUtils.canAccessStudentData(result.getStudentId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Bạn không có quyền xem chi tiết bài thi này"));
                }
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error retrieving detailed AI result: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống khi tải chi tiết bài thi"));
        }
    }

    @PostMapping("/ingest-context")
    @PreAuthorize("permitAll()") 
    public ResponseEntity<Map<String, String>> ingestContext(@RequestBody List<Map<String, Object>> records) {
        logger.info(">>> [NiFi-to-AI] Received {} records from NiFi", records.size());

        // BƯỚC 1: Lưu dữ liệu vào Database ngay lập tức
        studyContextService.saveContextFromNiFi(records);

        Set<Long> studentIds = new HashSet<>();
        for (Map<String, Object> record : records) {
            Object sid = record.get("user_id");
            if (sid == null) sid = record.get("studentId");

            if (sid != null) {
                Long studentId = Long.valueOf(sid.toString());
                studentIds.add(studentId);

                Object aid = record.get("attempt_id");
                
                // --- FIX 2: TÍCH HỢP CHẤM ĐIỂM NGẦM TẠI ĐÂY ---
                if (aid != null && record.get("answers") != null) {
                    Long attemptId = Long.valueOf(aid.toString());
                    try {
                        // Ép kiểu answers từ JSON của NiFi sang List<AnswerDTO>
                        String answersStr = jsonService.toJson(record.get("answers"));
                        List<AnswerDTO> answersList = objectMapper.readValue(answersStr, new TypeReference<List<AnswerDTO>>() {});
                        
                        ExamAnswersDTO dto = new ExamAnswersDTO();
                        dto.setStudentId(studentId);
                        dto.setAttemptId(attemptId);
                        dto.setAnswers(answersList);
                        if (record.get("exam_id") != null) {
                            dto.setExamId(Long.valueOf(record.get("exam_id").toString()));
                        }

                        // Kích hoạt luồng chấm điểm độc lập cho bài thi này
                        CompletableFuture.runAsync(() -> {
                            try {
                                logger.info(">>> [Async] Bắt đầu gọi AI chấm điểm cho attemptId: {}", attemptId);
                                aiService.evaluateExamFromDTO(dto);
                                logger.info(">>> [Async] Hoàn tất chấm điểm cho attemptId: {}", attemptId);
                            } catch (Exception e) {
                                logger.error(">>> [Async] Lỗi khi chấm điểm attempt {}: {}", attemptId, e.getMessage(), e);
                            }
                        }, taskExecutor);

                    } catch (Exception e) {
                        logger.error(">>> Lỗi parse answers cho attemptId {}: {}", attemptId, e.getMessage());
                    }
                }

                // Cập nhật course_id (Giữ nguyên của Dev)
                if (aid != null) {
                    Long attemptId = Long.valueOf(aid.toString());
                    Long courseId = record.get("course_id") != null ? Long.valueOf(record.get("course_id").toString()) : null;
                    if (courseId != null) {
                        aiService.updateComponentScores(attemptId, null, null, courseId);
                    }
                }
            }
        }

        // BƯỚC 3: Xử lý Lộ trình và Insight (Group theo Student)
        String content = jsonService.toJson(records);
        for (Long studentId : studentIds) {
            logger.info(">>> [NiFi-to-AI] Triggering async analysis for student: {}", studentId);
            processStudentAnalysisAsync(studentId, content);
        }

        Map<String, String> response = new HashMap<>();
        response.put("status", "ACCEPTED");
        response.put("message", "Ingestion queued for " + studentIds.size() + " students. Processing will continue asynchronously.");
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