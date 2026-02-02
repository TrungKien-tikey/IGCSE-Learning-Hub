package com.igcse.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        System.out.println(">>> CẤU HÌNH CORS ĐANG CHẠY: MỞ CỬA CHO TẤT CẢ <<<");
        registry.addMapping("/**") // Cho phép mọi đường dẫn
                .allowedOriginPatterns("*") // Dùng cái này thay cho allowedOrigins("*") để tránh lỗi credential
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}