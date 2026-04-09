package com.igcse.ai.controller;

import com.igcse.ai.service.goiyLoTrinhHoc.IRecommendationService;
import com.igcse.ai.util.SecurityUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/recommendations")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
public class RecommendationController {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationController.class);
    private final IRecommendationService recommendationService;

    public RecommendationController(IRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<?> getRecommendations(@PathVariable Long studentId) {
        // Fix BVA (Biên Min): Chặn ID âm hoặc bằng 0
        if (studentId == null || studentId <= 0) {
            logger.warn("🚨 Validation Error: Invalid studentId {}", studentId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID học sinh không hợp lệ"));
        }

        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Kiểm tra xem đã đăng nhập chưa
        if (currentUserId == null) {
            logger.warn("Unauthenticated request to access student recommendations");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Bạn cần đăng nhập để xem dữ liệu"));
        }

        // 1. Phân quyền chặt chẽ cho STUDENT
        if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
            if (!studentId.equals(currentUserId)) {
                logger.warn("Student {} attempted to view recommendations of Student {}", currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        } 
        // 2. Phân quyền cho TEACHER / ADMIN / PARENT
        else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                logger.warn("User {} attempted to access student {} recommendations without permission", 
                        currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
            }
        }

        // Fix BVA (Biên Max): Kiểm tra nếu chưa có lộ trình nào (dữ liệu ảo) hoặc ID không tồn tại
        var recommendations = recommendationService.getRecommendations(studentId);
        if (recommendations == null || "Vui lòng hoàn thành bài thi để nhận được gợi ý học tập.".equals(recommendations.getLearningPathSuggestion())) {
            logger.warn("🚨 Không tìm thấy dữ liệu lộ trình học cho studentId {}", studentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy dữ liệu gợi ý lộ trình học cho học sinh này"));
        }

        // Truyền trực tiếp dữ liệu đã lấy
        return ResponseEntity.ok(recommendations);
    }

    @PostMapping("/trigger/{studentId}")
    public ResponseEntity<?> triggerUpdate(
            @PathVariable Long studentId,
            @RequestBody(required = false) String nifiData) {
            
        // Fix BVA (Biên Min): Chặn ID âm hoặc bằng 0
        if (studentId == null || studentId <= 0) {
            logger.warn("🚨 Validation Error: Invalid studentId {}", studentId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ID học sinh không hợp lệ"));
        }

        String currentRole = SecurityUtils.getCurrentUserRole();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Kiểm tra đăng nhập
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Bạn cần đăng nhập để thực hiện thao tác này"));
        }

        // 1. Phân quyền chặt chẽ cho STUDENT (Chặn việc spam AI trigger của người khác)
        if (currentRole != null && currentRole.toUpperCase().contains("STUDENT")) {
            if (!studentId.equals(currentUserId)) {
                logger.warn("Student {} attempted to trigger AI update for Student {}", currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền cập nhật dữ liệu của học sinh này"));
            }
        } 
        // 2. Phân quyền cho TEACHER / ADMIN / PARENT
        else {
            if (!SecurityUtils.canAccessStudentData(studentId)) {
                logger.warn("User {} attempted to trigger AI update for student {} without permission", currentUserId, studentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền cập nhật dữ liệu của học sinh này"));
            }
        }

        recommendationService.triggerUpdate(studentId, nifiData);
        
        // Trả về JSON chuẩn thay vì Text thuần
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Đã gửi yêu cầu cập nhật lộ trình AI cho học sinh ID: " + studentId
        ));
    }
}