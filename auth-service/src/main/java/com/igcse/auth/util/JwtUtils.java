package com.igcse.auth.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails; // <--- Import cái này để check User
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function; // <--- Import để dùng Function

@Component
public class JwtUtils {

    // Key bí mật (Trong thực tế nên để trong file application.properties)
    private static final String SECRET_KEY = "daylakeybimatcuatoiphaidudaivaphucktap123456789"; 
    
    // Thời gian hết hạn token: 1 ngày (86400000 ms)
    private static final long EXPIRATION_TIME = 86400000L; 

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // ==================================================================
    // 1. CÁC HÀM TẠO TOKEN
    // ==================================================================

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

    // ==================================================================
    // 2. CÁC HÀM HỖ TRỢ FILTER & SECURITY (MỚI THÊM)
    // ==================================================================

    // Lấy Username (Email) từ Token - Dùng cho Filter
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Lấy ngày hết hạn từ Token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Hàm tổng quát để lấy bất kỳ thông tin nào trong Claims
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Parse toàn bộ Token để lấy Claims (Payload)
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Kiểm tra xem Token đã hết hạn chưa
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ==================================================================
    // 3. CÁC HÀM KIỂM TRA HỢP LỆ (VALIDATION)
    // ==================================================================

    /**
     * Kiểm tra Token có hợp lệ với UserDetails không (Dùng cho Security Filter)
     * Check 2 điều kiện:
     * 1. Email trong token phải trùng với User trong Database
     * 2. Token chưa hết hạn
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    /**
     * Kiểm tra nhanh Token có đúng chữ ký không (Dùng cho API verify-token đơn giản)
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token is expired: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token is unsupported: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT claims string is empty: " + e.getMessage());
        }
        return false;
    }
}