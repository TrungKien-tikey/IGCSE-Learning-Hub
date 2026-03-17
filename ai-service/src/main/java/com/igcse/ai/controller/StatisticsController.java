package com.igcse.ai.controller;

import com.igcse.ai.service.thongKe.IStatisticsService;
import com.igcse.ai.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
public class StatisticsController {
    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);
    private final IStatisticsService statisticsService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentStatistics(@PathVariable Long studentId) {
        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId(); 

        // Log ra để debug xem Role thực sự là gì nếu vẫn bị 200
        logger.info("🔍 Debug Auth: UserID={}, Role={}, TargetID={}", currentUserId, currentRole, studentId);

        // 1. Phân quyền chặt chẽ cho STUDENT
        // Dùng contains và toUpperCase để tránh lệch pha tiền tố ROLE_
        if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
            // Kiểm tra IDOR: studentId truyền vào phải khớp với currentUserId trong Token
            if (currentUserId == null || !studentId.equals(currentUserId)) {
                logger.warn("🚨 IDOR DETECTED: Student {} tried to view Student {}", currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh khác"));
            }
        } 
        // 2. Phân quyền cho TEACHER / ADMIN / PARENT
        else if (currentRole != null && (currentRole.toUpperCase().contains("TEACHER") || currentRole.toUpperCase().contains("ADMIN"))) {
            // Giáo viên/Admin thì cho qua (hoặc check canAccessStudentData nếu muốn gắt hơn nữa)
            logger.info("✅ Teacher/Admin accessing student data");
        }
        // 3. Trường hợp Role lạ hoặc không xác định
        else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Truy cập bị từ chối"));
            }
        }

        return ResponseEntity.ok(statisticsService.getStudentStatistics(studentId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getClassStatistics(@PathVariable Long classId) {
        String currentRole = SecurityUtils.getCurrentUserRole();
        if (!"ADMIN".equalsIgnoreCase(currentRole) && !"TEACHER".equalsIgnoreCase(currentRole)) {
            logger.warn("User {} with role {} attempted to access class {} statistics",
                    SecurityUtils.getCurrentUserId(), currentRole, classId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Chỉ giáo viên và admin mới có thể xem thống kê lớp học"));
        }

        logger.info("Teacher Dashboard: Fetching stats for class {}", classId);
        return ResponseEntity.ok(statisticsService.getClassStatistics(classId));
    }

    @GetMapping("/class/{classId}/exams")
    public ResponseEntity<?> getParticipatedExams(@PathVariable Long classId) {
        return ResponseEntity.ok(statisticsService.getParticipatedExamIds(classId));
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<?> getExamStats(@PathVariable Long examId, @RequestParam(required = false) Long classId) {
        return ResponseEntity.ok(statisticsService.getExamStatistics(examId, classId));
    }

    // --- NEW: Advanced Analytics ---

    @GetMapping("/analytics/{studentId}")
    public ResponseEntity<?> getLearningAnalytics(@PathVariable Long studentId) {
        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
            if (!studentId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        } else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        }

        return ResponseEntity.ok(statisticsService.getLearningAnalytics(studentId));
    }

    @GetMapping("/parent/summary/{studentId}")
    public ResponseEntity<?> getParentSummary(@PathVariable Long studentId) {
        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
            if (!studentId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        } else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        }

        return ResponseEntity.ok(statisticsService.getParentSummary(studentId));
    }

    @GetMapping("/system")
    public ResponseEntity<?> getSystemStatistics() {
        String currentRole = SecurityUtils.getCurrentUserRole();
        if (!"ADMIN".equalsIgnoreCase(currentRole)) {
            logger.warn("User {} with role {} attempted to access system statistics",
                    SecurityUtils.getCurrentUserId(), currentRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Chỉ admin mới có thể xem thống kê toàn hệ thống"));
        }

        return ResponseEntity.ok(statisticsService.getSystemStatistics());
    }
}