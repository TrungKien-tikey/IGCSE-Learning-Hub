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
        // Lấy studentId hợp lệ (STUDENT tự động dùng userId từ token)
        Long validStudentId = SecurityUtils.getValidStudentId(studentId);

        if (validStudentId == null) {
            logger.warn("Unauthenticated request to access student statistics");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Bạn cần đăng nhập để xem dữ liệu"));
        }

        // Kiểm tra quyền cho TEACHER/ADMIN (STUDENT đã được xử lý trong
        // getValidStudentId)
        String currentRole = SecurityUtils.getCurrentUserRole();
        if (!"STUDENT".equalsIgnoreCase(currentRole) && !SecurityUtils.canAccessStudentData(studentId)) {
            logger.warn("User {} attempted to access student {} statistics without permission",
                    SecurityUtils.getCurrentUserId(), studentId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }

        // Trả về dữ liệu (nếu không có dữ liệu, service sẽ trả về empty stats)
        return ResponseEntity.ok(statisticsService.getStudentStatistics(validStudentId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getClassStatistics(@PathVariable Long classId) {
        // Chỉ TEACHER và ADMIN được xem thống kê lớp
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

    @GetMapping("/system")
    public ResponseEntity<?> getSystemStatistics() {
        // Chỉ ADMIN được xem thống kê hệ thống
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
