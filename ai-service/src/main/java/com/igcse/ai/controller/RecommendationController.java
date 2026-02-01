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
        // Lấy studentId hợp lệ (STUDENT tự động dùng userId từ token)
        Long validStudentId = SecurityUtils.getValidStudentId(studentId);
        
        if (validStudentId == null) {
            logger.warn("Unauthenticated request to access student recommendations");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Bạn cần đăng nhập để xem dữ liệu"));
        }
        
        // Kiểm tra quyền cho TEACHER/ADMIN (STUDENT đã được xử lý trong getValidStudentId)
        String currentRole = SecurityUtils.getCurrentUserRole();
        if (!"STUDENT".equalsIgnoreCase(currentRole) && !SecurityUtils.canAccessStudentData(studentId)) {
            logger.warn("User {} attempted to access student {} recommendations without permission", 
                    SecurityUtils.getCurrentUserId(), studentId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền truy cập dữ liệu của học sinh này"));
        }
        
        // Trả về dữ liệu (nếu không có dữ liệu, service sẽ trả về empty recommendation)
        return ResponseEntity.ok(recommendationService.getRecommendations(validStudentId));
    }

    @PostMapping("/trigger/{studentId}")
    public ResponseEntity<String> triggerUpdate(
            @PathVariable Long studentId,
            @RequestBody(required = false) String nifiData) {
        recommendationService.triggerUpdate(studentId, nifiData);
        return ResponseEntity.ok("AI Recommendation update triggered with data for studentId: " + studentId);
    }
}
