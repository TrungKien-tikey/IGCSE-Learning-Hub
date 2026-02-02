package com.igcse.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequest {

    // 1. [FIX] Thêm trường email để AuthService tìm được User
    private String email;
    
    private String oldPassword;
    private String newPassword;
    private String confirmPassword; 

    // --- Getter và Setter ---

    // Getter & Setter cho Email (QUAN TRỌNG ĐỂ FIX LỖI)
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOldPassword() { return oldPassword; }
    public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}