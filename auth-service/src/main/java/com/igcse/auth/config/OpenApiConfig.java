package com.igcse.auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // Thiết lập các server (để Test trên Swagger gọi đúng cổng)
                .servers(List.of(
                        new Server().url("http://localhost:8000").description("Gateway Server"),
                        new Server().url("http://localhost:8080").description("Auth Service Local")
                ))
                // Thông tin chung về API
                .info(new Info()
                        .title("Auth Service API")
                        .version("1.0.0")
                        .description("Tài liệu API cho dịch vụ Xác thực (Auth Service)"));
    }
}