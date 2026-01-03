package com.igcse.auth.dto;

public class ChangePasswordRequest {
    private String email;
    private String oldPassword;
    private String newPassword;

    // Getter và Setter (Bạn có thể Generate tự động trong VS Code)
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOldPassword() { return oldPassword; }
    public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}