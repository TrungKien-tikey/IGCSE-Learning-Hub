package com.igcse.ai.config;

// No import needed as it's in the same package
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.core5.util.Timeout;
import org.springframework.lang.NonNull;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.client.RestTemplate;
import java.util.concurrent.TimeUnit;

// config/WebConfig.java
@Configuration
@EnableRetry
public class WebConfig {

    @Bean
    @NonNull
    public RestTemplate restTemplate(@NonNull RestTemplateBuilder builder) {
        // Connection Pool Configuration
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(100); // Tổng số connections
        connectionManager.setDefaultMaxPerRoute(20); // Max connections per route

        // Timeout phù hợp với từng loại request (dùng Apache HttpClient 5 config)
        @SuppressWarnings("deprecation")
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.of(5, TimeUnit.SECONDS))
                .setConnectionRequestTimeout(Timeout.of(5, TimeUnit.SECONDS))
                .setResponseTimeout(Timeout.of(120, TimeUnit.SECONDS)) // AI grading cần thời gian dài
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .evictIdleConnections(TimeValue.ofSeconds(30)) // Đóng idle connections
                .evictExpiredConnections()
                .build();

        java.util.Objects.requireNonNull(httpClient, "HttpClient must not be null");
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);

        RestTemplate restTemplate = new RestTemplate(factory);

        // Thêm interceptors cho logging
        restTemplate.getInterceptors().add(new RestTemplateLoggingInterceptor());

        return restTemplate;
    }
}
