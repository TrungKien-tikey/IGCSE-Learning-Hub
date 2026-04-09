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
        // Fix BVA: Chặn ID âm hoặc bằng 0
        if (studentId == null || studentId <= 0) {
            logger.warn("🚨 Validation Error: Invalid studentId {}", studentId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID học sinh không hợp lệ"));
        }

        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId(); 

        // 1. Phân quyền chặt chẽ cho STUDENT
        if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
            if (currentUserId == null || !studentId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh khác"));
            }
        } 
        // 2. Phân quyền cho TEACHER / ADMIN / PARENT
        else if (currentRole != null && (currentRole.toUpperCase().contains("TEACHER") || currentRole.toUpperCase().contains("ADMIN"))) {
            // Cho phép
        }
        // 3. Trường hợp Role lạ hoặc không xác định
        else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Truy cập bị từ chối"));
            }
        }

        // Fix BVA (Biên Max): Kiểm tra dữ liệu rỗng của học sinh
        var stats = statisticsService.getStudentStatistics(studentId);
        if (stats == null || stats.getTotalExams() == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy dữ liệu thống kê cho học sinh này"));
        }

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getClassStatistics(@PathVariable Long classId) {
        // Fix BVA: Chặn ID âm hoặc bằng 0
        if (classId == null || classId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID lớp học không hợp lệ"));
        }

        String currentRole = SecurityUtils.getCurrentUserRole();
        if (!"ADMIN".equalsIgnoreCase(currentRole) && !"TEACHER".equalsIgnoreCase(currentRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Chỉ giáo viên và admin mới có thể xem thống kê lớp học"));
        }

        // Fix BVA (Biên Max): Kiểm tra dữ liệu rỗng của Lớp học
        var stats = statisticsService.getClassStatistics(classId);
        if (stats == null || stats.getTotalStudents() == 0) {
            logger.warn("🚨 Không tìm thấy dữ liệu thống kê cho classId {}", classId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy dữ liệu thống kê cho lớp học này (Lớp trống hoặc không tồn tại)"));
        }

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/class/{classId}/exams")
    public ResponseEntity<?> getParticipatedExams(@PathVariable Long classId) {
        // Fix BVA: Chặn ID âm hoặc bằng 0
        if (classId == null || classId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID lớp học không hợp lệ"));
        }
        return ResponseEntity.ok(statisticsService.getParticipatedExamIds(classId));
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<?> getExamStats(@PathVariable Long examId, @RequestParam(required = false) Long classId) {
        // Fix BVA: Chặn ID âm hoặc bằng 0
        if (examId == null || examId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID bài thi không hợp lệ"));
        }
        
        // Fix BVA (Biên Max): Kiểm tra nếu chưa ai làm bài thi này
        var stats = statisticsService.getExamStatistics(examId, classId);
        if (stats == null || stats.getGradedCount() == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy dữ liệu thống kê cho bài thi này"));
        }
        
        return ResponseEntity.ok(stats);
    }

    // --- Advanced Analytics ---

    @GetMapping("/analytics/{studentId}")
    public ResponseEntity<?> getLearningAnalytics(@PathVariable Long studentId) {
        if (studentId == null || studentId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID học sinh không hợp lệ"));
        }

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
        if (studentId == null || studentId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID học sinh không hợp lệ"));
        }

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
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Chỉ admin mới có thể xem thống kê toàn hệ thống"));
        }

        return ResponseEntity.ok(statisticsService.getSystemStatistics());
    }
}