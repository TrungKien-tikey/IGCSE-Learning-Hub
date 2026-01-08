package com.igsce.exam_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class AIServiceClient {

    private final RestTemplate restTemplate;
    
    @Value("${ai.service.url:http://localhost:8082}")
    private String aiServiceUrl;

    public AIServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Gọi AI service để chấm điểm bài thi
     * @param attemptId ID của attempt
     * @param language Ngôn ngữ chấm điểm (vi/en)
     * @return true nếu thành công
     */
    public boolean markExam(Long attemptId, String language) {
        try {
            String url = aiServiceUrl + "/api/ai/mark-exam/" + attemptId + "?language=" + language;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                request, 
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.err.println("Lỗi gọi AI service: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
