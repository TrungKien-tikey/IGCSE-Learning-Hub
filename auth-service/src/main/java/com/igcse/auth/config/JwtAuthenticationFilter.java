package com.igcse.auth.config;

import com.igcse.auth.repository.BlacklistedTokenRepository; // <--- 1. MỚI: Import Repository
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
    // 2. MỚI: Khai báo biến Repository
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    // 3. MỚI: Cập nhật Constructor để nhận Repository vào
    public JwtAuthenticationFilter(
            JwtUtils jwtUtils,
            UserDetailsService userDetailsService,
            BlacklistedTokenRepository blacklistedTokenRepository
    ) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Kiểm tra xem Header có Token không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Lấy Token ra
        jwt = authHeader.substring(7);

        // --- [QUAN TRỌNG] BƯỚC KIỂM TRA BLACKLIST (MỚI THÊM) ---
        // Nếu Token nằm trong danh sách đen -> Chặn ngay lập tức!
        if (blacklistedTokenRepository.existsByToken(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // Trả về mã lỗi 401
            response.getWriter().write("Token da het han hoac da dang xuat!"); // Ghi thông báo lỗi
            return; // Dừng lại, không cho đi tiếp vào Controller
        }
        // -------------------------------------------------------

        // 3. Trích xuất Email từ Token
        userEmail = jwtUtils.extractUsername(jwt);

        // 4. Nếu có Email và chưa được xác thực
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Lấy thông tin User từ Database
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 5. Kiểm tra Token có hợp lệ không (Đúng chữ ký, chưa hết hạn thời gian)
            if (jwtUtils.isTokenValid(jwt, userDetails)) {

                // 6. Tạo đối tượng Authentication
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 7. LƯU VÀO SECURITY CONTEXT
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Cho phép request đi tiếp
        filterChain.doFilter(request, response);
    }
}