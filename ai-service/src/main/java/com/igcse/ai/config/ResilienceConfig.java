package com.igcse.ai.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class ResilienceConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig circuitBreakerConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50) // Mở mạch khi 50% request lỗi
                .waitDurationInOpenState(Duration.ofSeconds(30)) // Chờ 30s trước khi sang HALF_OPEN
                .slidingWindowSize(10) // Tính toán dựa trên 10 request gần nhất
                .permittedNumberOfCallsInHalfOpenState(3) // Thử 3 request ở trạng thái HALF_OPEN
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .build();

        return CircuitBreakerRegistry.of(circuitBreakerConfig);
    }
}
