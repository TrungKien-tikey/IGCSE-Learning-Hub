package com.igcse.auth.config;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.igcse.auth.repository.BlacklistedTokenRepository;
import com.igcse.auth.util.JwtUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final List<String> WHITELIST_PREFIXES = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/health",
            "/api/auth/check-email",
            "/api/auth/verify-token",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/refresh-token",
            "/v3/api-docs",
            "/swagger-ui",
            "/swagger-ui.html",
            "/actuator",
            "/error");

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    public JwtAuthenticationFilter(
            JwtUtils jwtUtils,
            UserDetailsService userDetailsService,
            BlacklistedTokenRepository blacklistedTokenRepository,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.blacklistedTokenRepository = blacklistedTokenRepository;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        if (WHITELIST_PREFIXES.stream().anyMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        if (blacklistedTokenRepository.existsByToken(jwt)) {
            commenceUnauthorized(request, response, "Token da het han hoac da dang xuat!");
            return;
        }

        try {
            String userEmail = jwtUtils.extractEmail(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                if (jwtUtils.validateToken(jwt)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    commenceUnauthorized(request, response, "Invalid or expired token");
                    return;
                }
            }
        } catch (Exception e) {
            logger.error("JWT validation failed: " + e.getMessage(), e);
            commenceUnauthorized(request, response, "Invalid or expired token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void commenceUnauthorized(
            HttpServletRequest request,
            HttpServletResponse response,
            String message) throws IOException, ServletException {
        request.setAttribute("auth_error", message);
        restAuthenticationEntryPoint.commence(
                request,
                response,
                new BadCredentialsException(message));
    }
}
