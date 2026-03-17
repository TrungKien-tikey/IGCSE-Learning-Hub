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
    String currentRole = SecurityUtils.getCurrentUserRole();
    Long currentUserId = SecurityUtils.getCurrentUserId(); // Giả sử bạn có hàm lấy ID từ token

    // 1. Phân quyền riêng cho STUDENT
    if ("STUDENT".equalsIgnoreCase(currentRole)) {
        // Nếu ID trên URL không khớp với ID trong token -> Chặn luôn 403
        if (!studentId.equals(currentUserId)) {
            logger.warn("Student {} attempted to view insight of Student {}", currentUserId, studentId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }
    } 
    // 2. Phân quyền cho ADMIN, TEACHER, PARENT
    else {
        if (!SecurityUtils.canAccessStudentData(studentId)) {
            logger.warn("User {} attempted to access student {} insights without permission", 
                    currentUserId, studentId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }
    }

    // 3. Passed hết các check bảo mật thì mới trả về dữ liệu
    return ResponseEntity.ok(insightService.getInsight(studentId));
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
