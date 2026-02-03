package com.igcse.auth.config;

import com.igcse.auth.repository.BlacklistedTokenRepository;
import com.igcse.auth.util.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public JwtAuthenticationFilter(
            JwtUtils jwtUtils,
            UserDetailsService userDetailsService,
            BlacklistedTokenRepository blacklistedTokenRepository) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // DEBUG LOG
        logger.info(">>> JWT Filter: " + request.getRequestURI());
        logger.info(">>> Authorization Header: " + (authHeader != null ? "EXISTS" : "NULL"));

        // 1. Kiểm tra Header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.debug(">>> No Bearer token found");
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Lấy Token
        jwt = authHeader.substring(7);

        // --- CHECK BLACKLIST ---
        if (blacklistedTokenRepository.existsByToken(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Token da het han hoac da dang xuat!");
            return;
        }
        // -----------------------

        // 3. Trích xuất Email từ Token và load User
        try {
            userEmail = jwtUtils.extractEmail(jwt);
            logger.info(">>> Extracted email: " + userEmail);

            // 4. Nếu có Email và chưa được xác thực
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Lấy thông tin User từ Database
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                logger.info(">>> User loaded: " + userEmail);

                // 5. Kiểm tra Token có hợp lệ không
                if (jwtUtils.validateToken(jwt)) {
                    logger.info(">>> Token is VALID");

                    // 6. Tạo đối tượng Authentication
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // 7. LƯU VÀO SECURITY CONTEXT
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info(">>> Authentication set in SecurityContext");
                } else {
                    logger.warn(">>> Token is INVALID");
                }
            }
        } catch (Exception e) {
            // Nếu token sai, hết hạn hoặc user không tồn tại trong DB mới
            // Chỉ cần log và cho phép request đi tiếp (nếu là public API)
            logger.error(">>> JWT validation failed: " + e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}