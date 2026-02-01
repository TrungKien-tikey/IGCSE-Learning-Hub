package com.igcse.auth.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    // Key bí mật
    private static final String SECRET_KEY = "daylakeybimatcuatoiphaidudaivaphucktap123456789"; 
    
    // Thời gian hết hạn Access Token: 1 ngày
    private static final long EXPIRATION_TIME = 86400000L; 

    // [MỚI] Thời gian hết hạn Refresh Token: 7 ngày (604800000 ms)
    private static final long REFRESH_EXPIRATION_TIME = 604800000L;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // 1. Tạo Access Token (Ngắn hạn)
    public String generateToken(String email, String role, Long userId) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("userId", userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // [MỚI] 2. Tạo Refresh Token (Dài hạn - 7 ngày)
    // Hàm này giống hệt hàm trên, chỉ khác thời gian hết hạn
    public String generateRefreshToken(String email, String role, Long userId) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("userId", userId)
                .claim("type", "REFRESH") // Đánh dấu đây là token refresh
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION_TIME)) // Dùng thời gian 7 ngày
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 3. Lấy email từ Token
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
    
    // [MỚI] Lấy thời gian hết hạn (Dùng cho Logout nếu cần)
    public Date extractExpiration(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }
    
    // [MỚI] Kiểm tra token hết hạn chưa
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // 4. Kiểm tra Token hợp lệ
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}