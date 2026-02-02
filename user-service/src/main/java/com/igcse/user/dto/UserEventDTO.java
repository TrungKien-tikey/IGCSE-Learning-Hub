package com.igcse.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserEventDTO {
    private String action; // "UPDATE", "DELETE", "DEACTIVATE", "ACTIVATE"
    private Long userId;
    private String fullName;
    private String role;
    private Boolean isActive;
    private String verificationStatus; // Thêm trường này

    // Constructor đầy đủ
    public UserEventDTO(String action, Long userId, String fullName, String role, Boolean isActive,
            String verificationStatus) {
        this.action = action;
        this.userId = userId;
        this.fullName = fullName;
        this.role = role;
        this.isActive = isActive;
        this.verificationStatus = verificationStatus;
    }

    // Constructor cũ (cho các chỗ khác dùng 5 tham số)
    public UserEventDTO(String action, Long userId, String fullName, String role, Boolean isActive) {
        this(action, userId, fullName, role, isActive, null);
    }
}
