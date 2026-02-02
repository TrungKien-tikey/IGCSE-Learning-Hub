package com.igcse.auth.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "blacklisted_tokens")
public class BlacklistedToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @Column(nullable = false)
    private Date expirationTime; // Lưu thời gian hết hạn gốc của Token

    // --- 1. CONSTRUCTOR RỖNG (Bắt buộc cho JPA) ---
    public BlacklistedToken() {
    }

    // --- 2. GETTER & SETTER THỦ CÔNG (Thay cho Lombok) ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Date getExpirationTime() {
        return expirationTime;
    }

    public void setExpirationTime(Date expirationTime) {
        this.expirationTime = expirationTime;
    }
}