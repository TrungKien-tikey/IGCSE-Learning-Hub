package com.igsce.exam_service.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // QUAN TRỌNG: Key này PHẢI GIỐNG HỆT key bên Auth-Service và file TestToken của bạn
    private static final String SECRET_KEY = "daylakeybimatcuatoiphaidudaivaphucktap123456789";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // 1. Lấy token từ header Authorization
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            // 2. Giải mã Token
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // 3. Lấy thông tin User ID và Role
            Long userId = claims.get("userId", Long.class);
            String role = claims.get("role", String.class);

            if (userId != null) {
                // Tạo Authority (Role)
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role);
                
                // 4. Tạo đối tượng Authentication
                // Lưu ý: userId được đưa vào làm Principal để SecurityUtils.getCurrentUserId() lấy được
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userId, null, List.of(authority));

                // 5. Lưu vào SecurityContext (Đăng nhập thành công cho request này)
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (Exception e) {
            // Nếu token sai, hết hạn... -> Không set Authentication -> Spring sẽ trả về 401/403 sau đó
            System.err.println("JWT Verification Failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}