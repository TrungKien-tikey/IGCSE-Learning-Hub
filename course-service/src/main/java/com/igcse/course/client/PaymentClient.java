package com.igcse.course.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

@Component
@Slf4j
public class PaymentClient {

    private final RestTemplate restTemplate;
    private final String paymentServiceUrl;

    @Autowired
    public PaymentClient(RestTemplate restTemplate,
            @Value("${payment.service.url:http://payment-service:8084}") String paymentServiceUrl) {
        this.restTemplate = restTemplate;
        this.paymentServiceUrl = paymentServiceUrl;
    }

    /**
     * Trừ 1 suất học của giáo viên
     */
    public boolean useSlot(Long teacherId) {
        try {
            String url = paymentServiceUrl + "/api/payment/teacher/" + teacherId + "/use-slot";
            restTemplate.postForObject(url, null, Map.class);
            log.info("Successfully deducted 1 slot for teacher {}", teacherId);
            return true;
        } catch (Exception e) {
            log.error("Error deducting slot for teacher {}: {}", teacherId, e.getMessage());
            return false;
        }
    }

    /**
     * Hoàn trả 1 suất học của giáo viên
     */
    public boolean returnSlot(Long teacherId) {
        try {
            String url = paymentServiceUrl + "/api/payment/teacher/" + teacherId + "/return-slot";
            restTemplate.postForObject(url, null, Map.class);
            log.info("Successfully returned 1 slot for teacher {}", teacherId);
            return true;
        } catch (Exception e) {
            log.error("Error returning slot for teacher {}: {}", teacherId, e.getMessage());
            return false;
        }
    }
}
