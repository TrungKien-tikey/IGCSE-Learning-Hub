package com.igcse.ai.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /**
     * Lấy userId từ SecurityContext (JWT token)
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof Number) {
                return ((Number) principal).longValue();
            } else if (principal instanceof String) {
                try {
                    return Long.parseLong((String) principal);
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        return null;
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
     * - TEACHER/ADMIN/PARENT: dùng studentId từ URL (có thể xem dữ liệu của học
     * sinh khác)
     */
    public static Long getValidStudentId(Long requestedStudentId) {
        Long currentUserId = getCurrentUserId();
        String currentRole = getCurrentUserRole();

        if (currentUserId == null || currentRole == null) {
            return null; // Không có authentication
        }

        // ADMIN, TEACHER, PARENT: Có thể xem dữ liệu của mình hoặc của học sinh khác
        if ("ADMIN".equalsIgnoreCase(currentRole) || "TEACHER".equalsIgnoreCase(currentRole)
                || "PARENT".equalsIgnoreCase(currentRole)) {
            return requestedStudentId != null ? requestedStudentId : currentUserId;
        }

        // STUDENT: Chỉ được phép xem dữ liệu của chính mình
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

        // ADMIN, TEACHER, PARENT được xem tất cả
        if ("ADMIN".equalsIgnoreCase(currentRole) || "TEACHER".equalsIgnoreCase(currentRole)
                || "PARENT".equalsIgnoreCase(currentRole)) {
            return true;
        }

        return false;
    }
}
