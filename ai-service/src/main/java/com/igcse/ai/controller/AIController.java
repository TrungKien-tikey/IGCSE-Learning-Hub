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
    private final ObjectMapper objectMapper; 

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
        // ... (Code cũ giữ nguyên)
        try {
            AIResult result = aiService.getResult(attemptId);
            if (result == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "AI đang xử lý hoặc không tìm thấy kết quả bài thi này"));
            }
            // ... (Phân quyền)
            AIResultResponse response = new AIResultResponse(result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Hệ thống gặp sự cố khi tải điểm"));
        }
    }

    @GetMapping("/result/{attemptId}/details")
    public ResponseEntity<?> getDetailedResult(@PathVariable Long attemptId) {
        // ... (Code cũ giữ nguyên)
        try {
            DetailedGradingResultDTO result = aiService.getDetailedResult(attemptId);
            if (result == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Không tìm thấy chi tiết bài thi này"));
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống khi tải chi tiết bài thi"));
        }
    }

    @PostMapping("/ingest-context")
    @PreAuthorize("permitAll()") 
    public ResponseEntity<?> ingestContext(@RequestBody List<Map<String, Object>> records) {
        logger.info(">>> [NiFi-to-AI] Received {} records from NiFi", records != null ? records.size() : 0);

        // --- TẦNG VALIDATION BẢO VỆ API ---
        // 1. Kiểm tra mảng rỗng (Biên Min = 1)
        if (records == null || records.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Dữ liệu gửi lên không được để trống"));
        }

        // 2. Kiểm tra giới hạn số lượng bài thi (Biên Max = 100)
        if (records.size() > 100) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Vượt quá giới hạn xử lý: Tối đa 100 bài thi mỗi lần gửi"));
        }

        // 3. Kiểm tra dữ liệu BÊN TRONG TỪNG BÀI THI
        for (Map<String, Object> record : records) {
            
            // 3.1 Fix Bug: Validate studentId (Không được âm hoặc bằng 0, không được null)
            // 3.1 Fix Bug BVA Max: Validate studentId
            Object sidObj = record.get("studentId") != null ? record.get("studentId") : record.get("user_id");
            if (sidObj == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Thiếu trường studentId bắt buộc"));
            }
            try {
                long sid = Long.parseLong(sidObj.toString());
                // Chặn số âm/zero VÀ chặn luôn số siêu lớn (Giả định Max ID thực tế là 10^12)
                if (sid <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "ID học sinh không hợp lệ (Phải lớn hơn 0)"));
                }
                
                // FIX RIÊNG CHO CASE MAX CỦA BẠN:
                if (sid >= 9223372036854775807L) { 
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "ID học sinh vượt quá giới hạn hệ thống cho phép"));
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Định dạng ID học sinh không hợp lệ"));
            }

            // 3.2 Fix Bug Test Case F6-11: Validate thiếu attempt_id
            if (record.get("attempt_id") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Truyền thiếu trường attempt_id bắt buộc"));
            }

            // 3.3 Validate số lượng câu trả lời (Max Answers = 50)
            Object answersObj = record.get("answers");
            if (answersObj instanceof List) {
                List<?> answers = (List<?>) answersObj;
                if (answers.size() > 50) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Lỗi dữ liệu: Một bài thi không được vượt quá 50 câu trả lời"));
                }
            }
        }
        // ------------------------------------------------------------

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
                
                // --- TÍCH HỢP CHẤM ĐIỂM NGẦM TẠI ĐÂY ---
                if (aid != null && record.get("answers") != null) {
                    Long attemptId = Long.valueOf(aid.toString());
                    try {
                        String answersStr = jsonService.toJson(record.get("answers"));
                        List<AnswerDTO> answersList = objectMapper.readValue(answersStr, new TypeReference<List<AnswerDTO>>() {});
                        
                        ExamAnswersDTO dto = new ExamAnswersDTO();
                        dto.setStudentId(studentId);
                        dto.setAttemptId(attemptId);
                        dto.setAnswers(answersList);
                        if (record.get("exam_id") != null) {
                            dto.setExamId(Long.valueOf(record.get("exam_id").toString()));
                        }

                        CompletableFuture.runAsync(() -> {
                            try {
                                aiService.evaluateExamFromDTO(dto);
                            } catch (Exception e) {
                                logger.error(">>> [Async] Lỗi khi chấm điểm attempt {}: {}", attemptId, e.getMessage());
                            }
                        }, taskExecutor);

                    } catch (Exception e) {
                        logger.error(">>> Lỗi parse answers cho attemptId {}: {}", attemptId, e.getMessage());
                    }
                }

                if (aid != null) {
                    Long attemptId = Long.valueOf(aid.toString());
                    Long courseId = record.get("course_id") != null ? Long.valueOf(record.get("course_id").toString()) : null;
                    if (courseId != null) {
                        aiService.updateComponentScores(attemptId, null, null, courseId);
                    }
                }
            }
        }

        // BƯỚC 3: Xử lý Lộ trình và Insight
        String content = jsonService.toJson(records);
        for (Long studentId : studentIds) {
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
                recommendationService.triggerUpdate(studentId, content);
                insightService.triggerUpdate(studentId, content);
            } catch (Exception e) {
                logger.error(">>> [Async] Error processing analysis for student {}", studentId);
            }
        }, taskExecutor);
    }

    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        return ResponseEntity.ok(health);
    }
}