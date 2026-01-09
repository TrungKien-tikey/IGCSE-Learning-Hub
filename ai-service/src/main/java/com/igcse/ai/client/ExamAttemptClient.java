package com.igcse.ai.client;

import com.igcse.ai.dto.aiChamDiem.AnswerDTO;
import com.igcse.ai.dto.aiChamDiem.EssayAnswer;
import com.igcse.ai.dto.aiChamDiem.ExamAnswersDTO;
import com.igcse.ai.exception.ExamAttemptNotFoundException;
import com.igcse.ai.exception.ExamServiceConnectionException;
import com.igcse.ai.exception.ExamServiceClientException;
import com.igcse.ai.exception.ExamServiceServerException;
import com.igcse.ai.exception.InvalidResponseException;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Client để lấy dữ liệu bài làm từ Exam Service
 */
@Component
@RequiredArgsConstructor
public class ExamAttemptClient {

  private static final Logger logger = LoggerFactory.getLogger(ExamAttemptClient.class);

  private final RestTemplate restTemplate;

  @Value("${exam.service.url:http://localhost:8080}")
  private String examServiceUrl;

  /**
   * Lấy ExamAnswersDTO từ Exam Service thông qua REST API
   * 
   * @param attemptId ID của exam attempt
   * @return ExamAnswersDTO object chứa danh sách câu trả lời
   * @throws ExamAttemptNotFoundException   nếu attempt không tồn tại (404)
   * @throws ExamServiceConnectionException nếu không thể kết nối đến Exam Service
   * @throws ExamServiceClientException     nếu lỗi client (4xx)
   * @throws ExamServiceServerException     nếu lỗi server (5xx)
   * @throws InvalidResponseException       nếu response không hợp lệ
   */
  @Retryable(retryFor = { ResourceAccessException.class,
      HttpServerErrorException.class }, maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2.0), noRetryFor = {
          HttpClientErrorException.NotFound.class, ExamAttemptNotFoundException.class })
  public ExamAnswersDTO getExamAttempt(Long attemptId) {
    Objects.requireNonNull(attemptId, "Attempt ID cannot be null");
    String url = examServiceUrl + "/api/exams/attempt/" + attemptId;
    logger.info("Fetching exam attempt from: {}", url);

    try {
      // Gọi sang Exam Service
      ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {
      };

      Map<String, Object> response = restTemplate.exchange(
          url,
          java.util.Objects.requireNonNull(HttpMethod.GET),
          null,
          responseType).getBody();

      // [DEBUG] Log raw response để kiểm tra dữ liệu
      logger.info(">>> Raw Response from Exam Service for attempt {}: {}", attemptId, response);

      if (response == null) {
        logger.error("Received null response from Exam Service for attemptId: {}", attemptId);
        throw new InvalidResponseException(url, "response body");
      }

      // Map data sang ExamAnswersDTO
      ExamAnswersDTO dto = new ExamAnswersDTO();
      dto.setAttemptId(attemptId);

      // Safe conversion for 'exam' object
      Object examObjRaw = response.get("exam");
      if (examObjRaw instanceof Map) {
        @SuppressWarnings("unchecked")
        Map<String, Object> examObj = (Map<String, Object>) examObjRaw;
        if (examObj.get("examId") instanceof Number) {
          dto.setExamId(((Number) examObj.get("examId")).longValue());
        }
      }

      if (response.get("userId") instanceof Number) {
        dto.setStudentId(((Number) response.get("userId")).longValue());
      }

      // Safe conversion for 'answers' list
      List<AnswerDTO> mappedAnswers = new ArrayList<>();
      Object answersListRaw = response.get("answers");

      if (answersListRaw instanceof List) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answersList = (List<Map<String, Object>>) answersListRaw;

        for (Map<String, Object> ans : answersList) {
          Object questionRaw = ans.get("question");
          if (!(questionRaw instanceof Map))
            continue;

          @SuppressWarnings("unchecked")
          Map<String, Object> question = (Map<String, Object>) questionRaw;

          String type = (String) question.get("questionType");
          if ("ESSAY".equals(type)) {
            EssayAnswer essay = new EssayAnswer();
            essay.setType("ESSAY");
            if (question.get("questionId") instanceof Number) {
              essay.setQuestionId(((Number) question.get("questionId")).longValue());
            }

            // Lấy đáp án của học sinh từ exam_answers.text_answer
            String studentAnswer = (String) ans.get("textAnswer");
            essay.setStudentAnswer(studentAnswer);
            logger.debug("Essay question {} - Student answer: {}",
                question.get("questionId"),
                studentAnswer != null ? studentAnswer.substring(0, Math.min(50, studentAnswer.length())) + "..."
                    : "NULL");

            // Lấy nội dung câu hỏi
            essay.setQuestionText((String) question.get("content"));

            // Lấy đáp án đúng của giáo viên từ questions.essay_correct_answer
            String refAnswer = (String) question.get("essayCorrectAnswer");
            essay.setReferenceAnswer(refAnswer != null ? refAnswer : "");
            logger.debug("Essay question {} - Reference answer: {}",
                question.get("questionId"),
                refAnswer != null ? refAnswer.substring(0, Math.min(50, refAnswer.length())) + "..." : "NULL");

            if (question.get("score") instanceof Number) {
              essay.setMaxScore(((Number) question.get("score")).doubleValue());
            }

            // Validate dữ liệu trước khi thêm vào
            if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
              logger.warn("⚠️ Essay question {} has empty student answer (textAnswer is null or empty)",
                  question.get("questionId"));
            }
            if (refAnswer == null || refAnswer.trim().isEmpty()) {
              logger.warn("⚠️ Essay question {} has no reference answer (essayCorrectAnswer is null or empty). " +
                  "AI grading may be less accurate.", question.get("questionId"));
            }

            mappedAnswers.add(essay);
            logger.info("✅ Mapped essay question {}: studentAnswer={}, referenceAnswer={}",
                question.get("questionId"),
                studentAnswer != null && !studentAnswer.isEmpty() ? "✓" : "✗",
                refAnswer != null && !refAnswer.isEmpty() ? "✓" : "✗");
          }
        }
      }

      // Set answers trực tiếp vào DTO
      dto.setAnswers(mappedAnswers);
      return dto;

    } catch (HttpClientErrorException.NotFound e) {
      // 404 - Attempt không tồn tại
      logger.warn("Exam attempt not found (404) for attemptId: {} - URL: {}", attemptId, url);
      throw new ExamAttemptNotFoundException(attemptId);

    } catch (HttpClientErrorException e) {
      // 4xx - Client errors (400, 401, 403, etc.)
      HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
      logger.error("Client error ({} {}) when fetching exam attempt {} from: {}",
          e.getStatusCode().value(),
          status != null ? status.getReasonPhrase() : "Unknown",
          attemptId, url, e);
      throw new ExamServiceClientException(url, status != null ? status : HttpStatus.BAD_REQUEST,
          e.getResponseBodyAsString());

    } catch (HttpServerErrorException e) {
      // 5xx - Server errors
      HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
      logger.error("Server error ({} {}) when fetching exam attempt {} from: {}",
          e.getStatusCode().value(),
          status != null ? status.getReasonPhrase() : "Unknown",
          attemptId, url, e);
      throw new ExamServiceServerException(url, status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR,
          e.getResponseBodyAsString());

    } catch (ResourceAccessException e) {
      // Connection timeout hoặc không thể kết nối
      logger.error("Connection error when fetching exam attempt {} from: {} - Error: {}",
          attemptId, url, e.getMessage(), e);
      throw ExamServiceConnectionException.withUrl(url, e);

    } catch (RestClientException e) {
      // Các lỗi RestTemplate khác
      logger.error("RestTemplate error when fetching exam attempt {} from: {}",
          attemptId, url, e);
      throw new ExamServiceConnectionException(url, e);

    } catch (Exception e) {
      // Lỗi không xác định
      logger.error("Unexpected error when fetching exam attempt {} from: {}",
          attemptId, url, e);
      throw new InvalidResponseException(
          String.format("Unexpected error: %s", e.getMessage()), e);
    }
  }

}