package com.igcse.ai.client;

import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.exception.ExamServiceConnectionException;
import com.igcse.ai.exception.ExamServiceClientException;
import com.igcse.ai.exception.ExamServiceServerException;
import lombok.RequiredArgsConstructor;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ExamServiceClient {
    private static final Logger logger = LoggerFactory.getLogger(ExamServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${exam.service.url:http://localhost:8080}")
    private String examServiceUrl;

    // public ExamServiceClient() {
    // this.restTemplate = new RestTemplate();
    // }

    /**
     * Gửi kết quả chấm điểm về Exam Service
     * 
     * @param attemptId ID của exam attempt
     * @param result    Kết quả chấm điểm chi tiết
     * @return true nếu gửi thành công, false nếu thất bại
     * @throws ExamServiceConnectionException nếu không thể kết nối đến Exam Service
     * @throws ExamServiceClientException     nếu lỗi client (4xx)
     * @throws ExamServiceServerException     nếu lỗi server (5xx)
     */
    @Retryable(retryFor = { ResourceAccessException.class,
            HttpServerErrorException.class }, maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2.0), noRetryFor = {
                    HttpClientErrorException.class })
    @CircuitBreaker(name = "examService", fallbackMethod = "fallbackUpdateGradingResult")
    public boolean updateGradingResult(Long attemptId, DetailedGradingResultDTO result) {
        if (attemptId == null) {
            logger.error("Attempt ID cannot be null when sending grading result");
            return false;
        }
        if (result == null) {
            logger.error("Grading result cannot be null for attemptId: {}", attemptId);
            return false;
        }

        String url = examServiceUrl + "/api/exams/grading-result";
        logger.info("Sending grading result callback to exam service: {} for attemptId: {}", url, attemptId);

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("attemptId", attemptId);

            List<Map<String, Object>> answerScores = new ArrayList<>();
            if (result.getDetails() != null) {
                for (GradingResult detail : result.getDetails()) {
                    // Chỉ gửi kết quả cho câu ESSAY
                    if ("ESSAY".equals(detail.getQuestionType())) {
                        Map<String, Object> answerScore = new HashMap<>();
                        answerScore.put("questionId", detail.getQuestionId());
                        answerScore.put("score", detail.getScore());
                        answerScore.put("feedback", detail.getFeedback());
                        answerScore.put("confidence", detail.getConfidence());
                        answerScores.add(answerScore);
                    }
                }
            }

            requestBody.put("answerScores", answerScores);
            requestBody.put("totalScore", result.getScore());
            requestBody.put("overallFeedback", result.getFeedback());
            requestBody.put("confidence", result.getConfidence());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                logger.info("Successfully sent grading result callback for attemptId: {}", attemptId);
                return true;
            } else {
                logger.warn("Grading result callback returned unsuccessful response for attemptId: {}. Response: {}",
                        attemptId, response);
                return false;
            }

        } catch (HttpClientErrorException e) {
            // 4xx - Client errors
            HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
            logger.error("Client error ({} {}) when sending grading result for attemptId {} to: {}. Response: {}",
                    e.getStatusCode().value(),
                    status != null ? status.getReasonPhrase() : "Unknown",
                    attemptId, url, e.getResponseBodyAsString(), e);

            // Không throw exception, chỉ log và return false để không làm fail quá trình
            // chấm điểm
            // Có thể retry sau hoặc lưu vào queue
            return false;

        } catch (HttpServerErrorException e) {
            // 5xx - Server errors (có thể retry)
            HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
            logger.error("Server error ({} {}) when sending grading result for attemptId {} to: {}. Response: {}",
                    e.getStatusCode().value(),
                    status != null ? status.getReasonPhrase() : "Unknown",
                    attemptId, url, e.getResponseBodyAsString(), e);

            // Throw để trigger retry mechanism
            throw new ExamServiceServerException(url, status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR,
                    e.getResponseBodyAsString());

        } catch (ResourceAccessException e) {
            // Connection timeout hoặc không thể kết nối (có thể retry)
            logger.error("Connection error when sending grading result for attemptId {} to: {} - Error: {}", 
                attemptId, url, e.getMessage(), e);
            
            // Throw để trigger retry mechanism
            throw ExamServiceConnectionException.withUrl(url, e);
            
        } catch (RestClientException e) {
            // Các lỗi RestTemplate khác
            logger.error("RestTemplate error when sending grading result for attemptId {} to: {}", 
                attemptId, url, e);
            throw ExamServiceConnectionException.withUrl(url, e);

        } catch (Exception e) {
            // Lỗi không xác định
            logger.error("Unexpected error when sending grading result for attemptId {} to: {}",
                    attemptId, url, e);
            // Không throw để không làm fail quá trình chấm điểm
            return false;
        }
    }

    /**
     * Fallback method cho updateGradingResult khi Circuit Breaker MỞ
     */
    public boolean fallbackUpdateGradingResult(Long attemptId, DetailedGradingResultDTO result, Throwable t) {
        logger.error("Circuit Breaker 'examService' triggered for updateGradingResult. AttemptId: {}. Error: {}",
                attemptId, t.getMessage());
        // Trả về false để quá trình chấm điểm không bị văng lỗi, có thể xử lý
        // retry/queue sau
        return false;
    }
}
