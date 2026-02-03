package com.igcse.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // <--- Quan trọng
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 1. Inject Filter xử lý JWT mà bạn vừa tạo
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Kích hoạt CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Tắt CSRF (vì dùng API Stateless)
                .csrf(csrf -> csrf.disable())

                // Cấu hình quyền truy cập (AUTHORIZATION)
                .authorizeHttpRequests(auth -> auth
                        // ✅ NHÓM CÔNG KHAI (Không cần Token)
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/verify-token", // Service khác gọi
                                "/api/auth/health", // Gateway check
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/check-email",
                                "/v3/api-docs/**", // Swagger
                                "/swagger-ui/**", // Swagger
                                "/swagger-ui.html",
                                "/actuator/**")
                        .permitAll()

                        // 🔒 NHÓM BẢO MẬT (Bắt buộc có Token)
                        // API /change-password sẽ rơi vào đây
                        .anyRequest().authenticated())

                // Stateless Session (Không lưu session trên server)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ⚠️ QUAN TRỌNG NHẤT: Thêm bộ lọc JWT trước bộ lọc Username/Password mặc định
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // --- Cấu hình CORS (Cho phép Frontend gọi) ---
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*")); // Chấp nhận mọi nguồn (Dev mode)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}