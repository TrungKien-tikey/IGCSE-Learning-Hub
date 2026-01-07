package com.igcse.ai.service;

import com.igcse.ai.client.ExamAttemptClient;
import com.igcse.ai.dto.GradingResult;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.entity.ExamAttempt;
import com.igcse.ai.exception.*;
import com.igcse.ai.repository.AIResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.LanguageService;
import com.igcse.ai.service.grading.IGradingService;

@Service
public class AIService {
    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private static final double PASSING_SCORE = 5.0;

    private final AIResultRepository aiResultRepository;
    private final IGradingService gradingService;
    private final ILanguageService languageService;
    private final ExamAttemptClient examAttemptClient;

    @Autowired
    public AIService(AIResultRepository aiResultRepository,
            IGradingService gradingService,
            ILanguageService languageService,
            ExamAttemptClient examAttemptClient) {
        this.aiResultRepository = aiResultRepository;
        this.gradingService = gradingService;
        this.languageService = languageService;
        this.examAttemptClient = examAttemptClient;
    }

    public double evaluateExam(Long attemptId) {
        return evaluateExam(attemptId, LanguageService.DEFAULT_LANGUAGE);
    }

    public double evaluateExam(Long attemptId, String language) {
        logger.info("Starting exam evaluation for attemptId: {}, language: {}", attemptId, language);

        Objects.requireNonNull(attemptId, "Attempt ID cannot be null");
        Objects.requireNonNull(language, "Language cannot be null");

        String lang = languageService.normalizeLanguage(language);

        if (!isValidLanguage(lang)) {
            logger.warn("Invalid language provided: {}", language);
            throw new InvalidLanguageException(language);
        }

        ExamAttempt attempt = examAttemptClient.getExamAttempt(attemptId);

        if (attempt == null) {
            logger.error("Exam attempt not found for ID: {}", attemptId);
            throw new ExamAttemptNotFoundException(attemptId);
        }

        // Chấm điểm tất cả câu trả lời với ngôn ngữ chỉ định
        List<GradingResult> gradingResults = gradingService.gradeAllAnswers(attempt.getAnswers(), lang);

        // Tính tổng điểm
        double totalScore = gradingService.calculateTotalScore(gradingResults);
        double maxScore = gradingService.calculateMaxScore(gradingResults);

        // Tính điểm trên thang 10
        double score = maxScore > 0 ? (totalScore / maxScore) * 10.0 : 0.0;

        // Tính confidence trung bình
        double confidence = gradingService.calculateAverageConfidence(gradingResults);

        // Tạo feedback tổng hợp với ngôn ngữ chỉ định
        String feedback = gradingService.generateOverallFeedback(gradingResults, lang);

        // Xác định method tổng
        // Nếu có ít nhất 1 câu dùng AI -> Tổng là AI
        // Nếu toàn bộ là LOCAL -> Tổng là LOCAL
        String overallMethod = "LOCAL_RULE_BASED";
        for (GradingResult r : gradingResults) {
            if ("AI_GPT4_LANGCHAIN".equals(r.getEvaluationMethod())) {
                overallMethod = "AI_GPT4_LANGCHAIN";
                break;
            }
        }

        // Lưu kết quả với language và confidence (upsert: update nếu đã có, insert nếu chưa có)
        AIResult result = aiResultRepository.findByAttemptId(attemptId)
                .orElse(new AIResult(attemptId, score, feedback, lang, confidence));

        // Update các trường
        result.setScore(score);
        result.setFeedback(feedback);
        result.setLanguage(lang);
        result.setConfidence(confidence);
        result.setStudentId(attempt.getStudentId());
        result.setExamId(attempt.getExamId());
        result.setEvaluationMethod(overallMethod);
        result.setGradedAt(new java.util.Date());

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            result.setDetails(mapper.writeValueAsString(gradingResults));
        } catch (Exception e) {
            logger.error("Error serializing grading details for attemptId: {}", attemptId, e);
            throw new ExamGradingException("Failed to serialize grading details", e);
        }

        aiResultRepository.save(result);
        logger.info("Exam evaluation completed for attemptId: {}, score: {}", attemptId, score);

        return score;
    }

    public String analyzeAnswers(Long attemptId) {
        return analyzeAnswers(attemptId, LanguageService.DEFAULT_LANGUAGE);
    }

    public String analyzeAnswers(Long attemptId, String language) {
        logger.info("Analyzing answers for attemptId: {}", attemptId);

        Objects.requireNonNull(attemptId, "Attempt ID cannot be null");

        AIResult result = aiResultRepository.findByAttemptId(attemptId).orElse(null);

        if (result != null) {
            logger.debug("Returning cached feedback for attemptId: {}", attemptId);
            return result.getFeedback();
        }

        logger.debug("No cached result found, evaluating exam for attemptId: {}", attemptId);
        evaluateExam(attemptId, language);
        result = aiResultRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new ExamGradingException("Failed to grade exam", attemptId));

        return result.getFeedback();
    }

    public AIResult getResult(Long attemptId) {
        logger.debug("Fetching result for attemptId: {}", attemptId);
        Objects.requireNonNull(attemptId, "Attempt ID cannot be null");

        return aiResultRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new AIResultNotFoundException(attemptId));
    }

    public com.igcse.ai.dto.DetailedGradingResultDTO getDetailedResult(Long attemptId) {
        logger.debug("Fetching detailed result for attemptId: {}", attemptId);
        Objects.requireNonNull(attemptId, "Attempt ID cannot be null");

        AIResult result = getResult(attemptId);
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<GradingResult> detailsList = new java.util.ArrayList<>();

        if (result.getDetails() != null && !result.getDetails().isEmpty()) {
            try {
                detailsList = mapper.readValue(result.getDetails(),
                        mapper.getTypeFactory().constructCollectionType(List.class, GradingResult.class));
                logger.debug("Successfully parsed grading details for attemptId: {}", attemptId);
            } catch (Exception e) {
                logger.error("Error parsing grading details for attemptId: {}", attemptId, e);
                throw new ExamGradingException("Failed to parse grading details", e);
            }
        }

        Double maxScore = 10.0;
        if (!detailsList.isEmpty()) {
            maxScore = gradingService.calculateMaxScore(detailsList);
        }

        return new com.igcse.ai.dto.DetailedGradingResultDTO(
                result.getAttemptId(),
                result.getScore(),
                maxScore,
                result.getFeedback(),
                result.getConfidence(),
                result.getLanguage(),
                detailsList);
    }

    private boolean isValidLanguage(String language) {
        return LanguageService.ENGLISH.equals(language) ||
                LanguageService.VIETNAMESE.equals(language) ||
                LanguageService.AUTO.equals(language);
    }

    /**
     * Lấy điểm đạt tối thiểu
     */
    public double getPassingScore() {
        return PASSING_SCORE;
    }
}
