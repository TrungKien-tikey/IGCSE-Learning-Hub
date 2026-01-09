package com.igcse.ai.config;

import org.springframework.lang.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class RestTemplateLoggingInterceptor implements ClientHttpRequestInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RestTemplateLoggingInterceptor.class);

    @Override
    @NonNull
    public ClientHttpResponse intercept(@NonNull HttpRequest request, @NonNull byte[] body,
            @NonNull ClientHttpRequestExecution execution) throws IOException {
        logRequest(request, body);
        ClientHttpResponse response = execution.execute(request, body);
        logResponse(response);
        return response;
    }

    private void logRequest(@NonNull HttpRequest request, @NonNull byte[] body) {
        logger.info("===========================request begin================================================");
        logger.info("URI         : {}", request.getURI());
        logger.info("Method      : {}", request.getMethod());
        logger.info("Headers     : {}", request.getHeaders());
        logger.info("Request body: {}", new String(body, StandardCharsets.UTF_8));
        logger.info("==========================request end==================================================");
    }

    private void logResponse(ClientHttpResponse response) throws IOException {
        logger.info("============================response begin==============================================");
        logger.info("Status code  : {}", response.getStatusCode());
        logger.info("Status text  : {}", response.getStatusText());
        logger.info("Headers      : {}", response.getHeaders());

        // Lưu ý: Đọc body ở đây có thể làm mất body nếu không sử dụng
        // BufferingClientHttpRequestFactory
        // Tuy nhiên để đơn giản hoá ta chỉ log status code và headers trước

        logger.info("==========================response end==================================================");
    }
}
