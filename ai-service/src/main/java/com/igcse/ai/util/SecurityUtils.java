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
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
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
                    .filter(auth -> auth.startsWith("ROLE_"))
                    .map(auth -> auth.substring(5)) // Remove "ROLE_" prefix
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }
    
    /**
     * Lấy studentId hợp lệ để truy vấn dữ liệu
     * - STUDENT: tự động dùng userId từ token (bỏ qua studentId trong URL)
     * - TEACHER/ADMIN: dùng studentId từ URL (có thể xem dữ liệu của học sinh khác)
     * - PARENT: tạm thời dùng studentId từ URL (cần implement relationship check sau)
     */
    public static Long getValidStudentId(Long requestedStudentId) {
        Long currentUserId = getCurrentUserId();
        String currentRole = getCurrentUserRole();
        
        if (currentUserId == null || currentRole == null) {
            return null; // Không có authentication
        }
        
        // STUDENT: tự động dùng userId từ token, bỏ qua studentId trong URL
        if ("STUDENT".equalsIgnoreCase(currentRole)) {
            return currentUserId;
        }
        
        // TEACHER/ADMIN/PARENT: dùng studentId từ URL (có thể xem dữ liệu của học sinh khác)
        return requestedStudentId;
    }
    
    /**
     * Kiểm tra user có quyền xem dữ liệu của studentId không (dùng cho TEACHER/ADMIN)
     * STUDENT không cần check vì đã tự động dùng userId từ token
     */
    public static boolean canAccessStudentData(Long studentId) {
        Long currentUserId = getCurrentUserId();
        String currentRole = getCurrentUserRole();
        
        if (currentUserId == null || currentRole == null) {
            return false; // Không có authentication
        }
        
        // ADMIN và TEACHER được xem tất cả
        if ("ADMIN".equalsIgnoreCase(currentRole) || "TEACHER".equalsIgnoreCase(currentRole)) {
            return true;
        }
        
        // PARENT: tạm thời cho phép (cần implement relationship check sau)
        if ("PARENT".equalsIgnoreCase(currentRole)) {
            return true; // TODO: Check parent-child relationship
        }
        
        return false;
    }
}
