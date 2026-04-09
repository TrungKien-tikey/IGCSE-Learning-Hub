package com.igcse.ai.controller;

import com.igcse.ai.dto.phanTich.AIInsightDTO;
import com.igcse.ai.service.phanTich.IInsightService;
import com.igcse.ai.util.SecurityUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/insights")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
public class InsightController {

    private static final Logger logger = LoggerFactory.getLogger(InsightController.class);
    private final IInsightService insightService;

    public InsightController(IInsightService insightService) {
        this.insightService = insightService;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getInsight(@PathVariable Long studentId) {
        // 1. Fix BVA (Biên Min): Chặn ID âm hoặc bằng 0
        if (studentId == null || studentId <= 0) {
            logger.warn("🚨 Validation Error: Invalid studentId {}", studentId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID học sinh không hợp lệ"));
        }

        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId(); 

        // 2. Phân quyền riêng cho STUDENT
        if ("STUDENT".equalsIgnoreCase(currentRole)) {
            if (!studentId.equals(currentUserId)) {
                logger.warn("Student {} attempted to view insight of Student {}", currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        } 
        // 3. Phân quyền cho ADMIN, TEACHER, PARENT
        else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                logger.warn("User {} attempted to access student {} insights without permission", 
                        currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        }

        // 4. Fix BVA (Biên Max): Kiểm tra nếu bị rỗng hoặc là dữ liệu giả (Chưa có dữ liệu)
        AIInsightDTO insight = insightService.getInsight(studentId);
        if (insight == null || "Chưa có dữ liệu để phân tích.".equals(insight.getOverallSummary())) {
            logger.warn("🚨 Không tìm thấy dữ liệu Insight cho studentId {}", studentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy dữ liệu phân tích cho học sinh này"));
        }

        return ResponseEntity.ok(insight);
    }

    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<?> getInsightByAttempt(@PathVariable Long attemptId) {
        // Fix BVA (Biên Min): Chặn ID âm hoặc bằng 0 cho attemptId
        if (attemptId == null || attemptId <= 0) {
            logger.warn("🚨 Validation Error: Invalid attemptId {}", attemptId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID lượt làm bài không hợp lệ"));
        }

        AIInsightDTO insight = insightService.getInsightByAttempt(attemptId);

        // Fix BVA (Biên Max): Kiểm tra dữ liệu ảo cho attemptId
        if (insight == null || "Chưa có dữ liệu để phân tích.".equals(insight.getOverallSummary())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy kết quả phân tích cho lượt làm bài này"));
        }

        // Kiểm tra quyền truy cập
        if (!SecurityUtils.canAccessStudentData(insight.getStudentId())) {
            logger.warn("User {} attempted to access insight for attempt {} of student {} without permission",
                    SecurityUtils.getCurrentUserId(), attemptId, insight.getStudentId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }

        return ResponseEntity.ok(insight);
    }
}