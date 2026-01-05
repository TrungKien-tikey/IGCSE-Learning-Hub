package com.igcse.user.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Date;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false)
    private String email;

    // --- PHẦN BẠN ĐANG THIẾU ---
    private String fullName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatar;
    // ---------------------------

    private String role;
    private boolean isActive = true;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    public User() {
    }

    // --- CẦN PHẢI CÓ CÁC GETTER/SETTER NÀY ---
    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
    // -----------------------------------------

    // Các getter/setter khác (giữ nguyên hoặc thêm nếu thiếu)
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}