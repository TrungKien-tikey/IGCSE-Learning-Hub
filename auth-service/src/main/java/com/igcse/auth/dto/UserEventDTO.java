package com.igcse.auth.dto;

public class UserEventDTO {
    private String action; // "UPDATE", "DELETE", "DEACTIVATE", "ACTIVATE"
    private Long userId;
    private String fullName;
    private String role;
    private Boolean isActive;
    private String verificationStatus;

    public UserEventDTO() {
    }

    public UserEventDTO(String action, Long userId, String fullName, String role, Boolean isActive,
            String verificationStatus) {
        this.action = action;
        this.userId = userId;
        this.fullName = fullName;
        this.role = role;
        this.isActive = isActive;
        this.verificationStatus = verificationStatus;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
