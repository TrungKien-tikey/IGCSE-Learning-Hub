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
        // Lấy studentId hợp lệ (STUDENT tự động dùng userId từ token)
        Long validStudentId = SecurityUtils.getValidStudentId(studentId);
        
        if (validStudentId == null) {
            logger.warn("Unauthenticated request to access student insights");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Bạn cần đăng nhập để xem dữ liệu"));
        }
        
        // Kiểm tra quyền cho TEACHER/ADMIN (STUDENT đã được xử lý trong getValidStudentId)
        String currentRole = SecurityUtils.getCurrentUserRole();
        if (!"STUDENT".equalsIgnoreCase(currentRole) && !SecurityUtils.canAccessStudentData(studentId)) {
            logger.warn("User {} attempted to access student {} insights without permission", 
                    SecurityUtils.getCurrentUserId(), studentId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }
        
        // Trả về dữ liệu (nếu không có dữ liệu, service sẽ trả về empty insight)
        return ResponseEntity.ok(insightService.getInsight(validStudentId));
    }

    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<?> getInsightByAttempt(@PathVariable Long attemptId) {
        AIInsightDTO insight = insightService.getInsightByAttempt(attemptId);

        if (insight == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy kết quả phân tích cho lượt làm bài này"));
        }

        // Kiểm tra quyền truy cập (Học sinh chỉ xem bài của mình, Teacher/Admin xem
        // hết)
        if (!SecurityUtils.canAccessStudentData(insight.getStudentId())) {
            logger.warn("User {} attempted to access insight for attempt {} of student {} without permission",
                    SecurityUtils.getCurrentUserId(), attemptId, insight.getStudentId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }

        return ResponseEntity.ok(insight);
    }
}
