package com.igsce.exam_service.client;

import com.igsce.exam_service.dto.AIGradingResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Client để lấy kết quả chấm điểm từ AI Service
 * Lấy dữ liệu từ ai_db.ai_results thông qua REST API
 */
@Component
public class AIServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(AIServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8082}")
    private String aiServiceUrl;

    public AIServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Lấy kết quả chấm điểm tổng hợp từ AI Service
     * Tương ứng với dữ liệu trong ai_db.ai_results
     * 
     * @param attemptId ID của lượt làm bài
     * @return AIGradingResultDTO chứa score, feedback, confidence, language, etc.
     */
    public AIGradingResultDTO getAIGradingResult(Long attemptId) {
        String url = aiServiceUrl + "/api/ai/result/" + attemptId;
        logger.info("Fetching AI grading result from: {}", url);

        try {
            ParameterizedTypeReference<Map<String, Object>> responseType = 
                new ParameterizedTypeReference<Map<String, Object>>() {};
            
            Map<String, Object> response = restTemplate.exchange(
                url,
                Objects.requireNonNull(HttpMethod.GET),
                null,
                responseType
            ).getBody();

            if (response == null) {
                logger.warn("No AI grading result found for attemptId: {}", attemptId);
                return null;
            }

            // Map response từ AI Service sang DTO
            AIGradingResultDTO result = new AIGradingResultDTO();
            result.setAttemptId(attemptId);
            
            if (response.get("score") instanceof Number) {
                result.setScore(((Number) response.get("score")).doubleValue());
            }
            
            result.setFeedback((String) response.get("feedback"));
            result.setLanguage((String) response.get("language"));
            
            if (response.get("confidence") instanceof Number) {
                result.setConfidence(((Number) response.get("confidence")).doubleValue());
            }
            
            result.setConfidenceLevel((String) response.get("confidenceLevel"));
            result.setEvaluationMethod((String) response.get("evaluationMethod"));
            
            if (response.get("gradedAt") != null) {
                // Convert timestamp hoặc date string
                result.setGradedAt(response.get("gradedAt"));
            }

            logger.debug("Successfully fetched AI grading result for attemptId: {}", attemptId);
            return result;

        } catch (Exception e) {
            logger.error("Error fetching AI grading result for attemptId: {}", attemptId, e);
            return null; // Return null nếu không lấy được (có thể chưa chấm)
        }
    }

    /**
     * Lấy kết quả chấm điểm chi tiết từ AI Service
     * Bao gồm feedback cho từng câu hỏi
     * 
     * @param attemptId ID của lượt làm bài
     * @return Map chứa chi tiết kết quả chấm điểm
     */
    public Map<String, Object> getDetailedAIGradingResult(Long attemptId) {
        String url = aiServiceUrl + "/api/ai/result/" + attemptId + "/details";
        logger.info("Fetching detailed AI grading result from: {}", url);

        try {
            ParameterizedTypeReference<Map<String, Object>> responseType = 
                new ParameterizedTypeReference<Map<String, Object>>() {};
            
            Map<String, Object> response = restTemplate.exchange(
                url,
                Objects.requireNonNull(HttpMethod.GET),
                null,
                responseType
            ).getBody();

            if (response == null) {
                logger.warn("No detailed AI grading result found for attemptId: {}", attemptId);
                return null;
            }

            logger.debug("Successfully fetched detailed AI grading result for attemptId: {}", attemptId);
            return response;

        } catch (Exception e) {
            logger.error("Error fetching detailed AI grading result for attemptId: {}", attemptId, e);
            return null;
        }
    }

    /**
     * Kiểm tra xem AI đã chấm điểm chưa
     * 
     * @param attemptId ID của lượt làm bài
     * @return true nếu đã có kết quả, false nếu chưa
     */
    public boolean hasAIGradingResult(Long attemptId) {
        AIGradingResultDTO result = getAIGradingResult(attemptId);
        return result != null && result.getScore() != null;
    }
}






