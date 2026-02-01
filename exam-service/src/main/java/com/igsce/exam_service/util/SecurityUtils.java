package com.igsce.exam_service.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /**
     * Lấy userId từ SecurityContext (JWT token)
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new RuntimeException("Người dùng chưa đăng nhập hoặc Token không hợp lệ");
    }

    /**
     * Lấy role từ SecurityContext
     */
    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getAuthorities() != null) {
            return authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(auth -> auth != null && auth.startsWith("ROLE_"))
                    .map(auth -> auth.substring(5).trim().toUpperCase()) // Remove "ROLE_" and normalize
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    /**
     * Lấy studentId hợp lệ để truy vấn dữ liệu
     * - STUDENT: tự động dùng userId từ token (bỏ qua studentId trong URL)
     * - TEACHER/ADMIN: dùng studentId từ URL (có thể xem dữ liệu của học sinh khác)
     * - PARENT: tạm thời dùng studentId từ URL (cần implement relationship check
     * sau)
     */
    public static Long getValidStudentId(Long requestedStudentId) {
        Long currentUserId = getCurrentUserId();
        String currentRole = getCurrentUserRole();

        if (currentUserId == null || currentRole == null) {
            return null; // Không có authentication
        }

        // ADMIN và TEACHER: Có thể xem dữ liệu của mình hoặc của học sinh khác
        if ("ADMIN".equalsIgnoreCase(currentRole) || "TEACHER".equalsIgnoreCase(currentRole)) {
            return requestedStudentId != null ? requestedStudentId : currentUserId;
        }

        // STUDENT: Chỉ được phép xem dữ liệu của chính mình
        // PARENT: Tạm thời chỉ được phép xem dữ liệu của chính mình (Cần relationship
        // check để xem con)
        return currentUserId;
    }

    /**
     * Kiểm tra user có quyền xem dữ liệu của studentId không (dùng cho
     * TEACHER/ADMIN)
     * STUDENT không cần check vì đã tự động dùng userId từ token
     */
    public static boolean canAccessStudentData(Long studentId) {
        if (studentId == null)
            return false;

        Long currentUserId = getCurrentUserId();
        String currentRole = getCurrentUserRole();

        if (currentUserId == null || currentRole == null) {
            return false;
        }

        // Sở hữu chính mình
        if (studentId.equals(currentUserId)) {
            return true;
        }

        // ADMIN và TEACHER được xem tất cả
        if ("ADMIN".equalsIgnoreCase(currentRole) || "TEACHER".equalsIgnoreCase(currentRole)) {
            return true;
        }

        // PARENT: TODO: Implement parent-child relationship check
        // Hiện tại chỉ cho phép xem chính mình (coi như studentId == currentUserId đã
        // check trên)

        return false;
    }
}
