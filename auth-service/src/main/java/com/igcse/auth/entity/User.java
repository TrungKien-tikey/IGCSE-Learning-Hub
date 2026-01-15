package com.igcse.auth.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails { // ✅ Implement UserDetails của Spring Security

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(name = "full_name")
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private boolean isActive = true;

    // ===== 1. CÁC TRƯỜNG MỚI CHO QUÊN MẬT KHẨU (ILH-64) =====
    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "token_expiration_time")
    private LocalDateTime tokenExpirationTime;

    // ===== Constructor =====
    public User() {}

    // ===== 2. GETTER & SETTER CHO CÁC TRƯỜNG MỚI =====
    
    public String getResetPasswordToken() {
        return resetPasswordToken;
    }

    public void setResetPasswordToken(String resetPasswordToken) {
        this.resetPasswordToken = resetPasswordToken;
    }

    public LocalDateTime getTokenExpirationTime() {
        return tokenExpirationTime;
    }

    public void setTokenExpirationTime(LocalDateTime tokenExpirationTime) {
        this.tokenExpirationTime = tokenExpirationTime;
    }

    // ===== Getter & Setter Cũ =====
    public Long getId() {
        return userId;
    }

    public void setId(Long userId) {
        this.userId = userId;
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

    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPasswordHash() {
        return passwordHash;
    }
    
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }

    // ===== 3. PHƯƠNG THỨC CỦA SPRING SECURITY (UserDetails) =====
    // Giúp Spring hiểu User này có quyền gì, mật khẩu là gì...

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Chuyển Role String thành Authority mà Spring hiểu
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        return passwordHash; // Spring sẽ dùng cái này để so khớp mật khẩu
    }

    @Override
    public String getUsername() {
        return email; // Spring dùng Email làm Username đăng nhập
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive; // Nếu isActive = false thì không cho đăng nhập
    }
}