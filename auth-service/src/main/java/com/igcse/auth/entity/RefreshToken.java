package com.igcse.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity(name = "refreshtoken")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "userId")
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private Instant expiryDate;

    // Getter, Setter, Constructor...
    public RefreshToken() {}
    // ... bạn tự generate getter/setter nhé
}