package com.igcse.ai.service;

import com.igcse.ai.client.ExamAttemptClient;
import com.igcse.ai.client.ExamServiceClient;
import com.igcse.ai.dto.aiChamDiem.ExamAnswersDTO;
import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.exception.*;
import com.igcse.ai.repository.AIResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.igcse.ai.service.common.JsonService;
import java.util.List;
import java.util.Objects;
import com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO;
import com.igcse.ai.service.aiChamDiem.IGradingService;
import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.LanguageService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Optional;

@Service
public class AIService {
    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private static final double PASSING_SCORE = 5.0;
    private final JsonService jsonService;
    private final AIResultRepository aiResultRepository;
    private final IGradingService gradingService;
    private final ILanguageService languageService;
    private final ExamAttemptClient examAttemptClient;
    private final ExamServiceClient examServiceClient;
    private final java.util.concurrent.Executor taskExecutor;

    public AIService(
            JsonService jsonService,
            AIResultRepository aiResultRepository,
            IGradingService gradingService,
            ILanguageService languageService,
            ExamAttemptClient examAttemptClient,
            ExamServiceClient examServiceClient,
            @org.springframework.beans.factory.annotation.Qualifier("taskExecutor") java.util.concurrent.Executor taskExecutor) {
        this.jsonService = jsonService;
        this.aiResultRepository = aiResultRepository;
        this.gradingService = gradingService;
        this.languageService = languageService;
        this.examAttemptClient = examAttemptClient;
        this.examServiceClient = examServiceClient;
        this.taskExecutor = taskExecutor;
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

        // ✅ TỐI ƯU: Kiểm tra cache trước khi gọi API
        Optional<AIResult> existingResult = aiResultRepository.findByAttemptId(attemptId);

        // Lấy attempt data để tính hash
        ExamAnswersDTO attempt = examAttemptClient.getExamAttempt(attemptId);
        if (attempt == null) {
            logger.error("Exam attempt not found for ID: {}", attemptId);
            throw new ExamAttemptNotFoundException(attemptId);
        }

        // Tính hash của answers hiện tại (serialize để tính hash)
        String answersJson = jsonService.toJson(attempt);
        String currentAnswersHash = calculateHash(answersJson);

        // ✅ VALIDATION: Kiểm tra cache với hash validation
        if (existingResult.isPresent()) {
            AIResult cachedResult = existingResult.get();
            String cachedHash = cachedResult.getAnswersHash();

            // Nếu language giống và hash giống → return cache (answers không thay đổi)
            if (lang.equals(cachedResult.getLanguage()) &&
                    currentAnswersHash != null &&
                    currentAnswersHash.equals(cachedHash)) {
                logger.info("✅ Returning cached result for attemptId: {} (answers unchanged, language: {}, score: {})",
                        attemptId, lang, cachedResult.getScore());
                return cachedResult.getScore();
            } else {
                if (currentAnswersHash != null && !currentAnswersHash.equals(cachedHash)) {
                    logger.info("🔄 Answers changed for attemptId: {}. Re-grading... (old hash: {}, new hash: {})",
                            attemptId,
                            cachedHash != null ? cachedHash.substring(0, Math.min(8, cachedHash.length())) + "..."
                                    : "null",
                            currentAnswersHash.substring(0, Math.min(8, currentAnswersHash.length())) + "...");
                } else if (!lang.equals(cachedResult.getLanguage())) {
                    logger.info("🔄 Language changed from {} to {} for attemptId: {}. Re-grading...",
                            cachedResult.getLanguage(), lang, attemptId);
                } else {
                    logger.info("🔄 Re-grading attemptId: {} (hash validation failed)", attemptId);
                }
                // Fall through để re-grade
            }
        } else {
            logger.debug("No cached result found for attemptId: {}. Grading new...", attemptId);
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

        // Lưu kết quả với language và confidence (upsert: update nếu đã có, insert nếu
        // chưa có)
        AIResult result = existingResult.orElse(new AIResult(attemptId, score, feedback, lang, confidence));

        // Update các trường
        result.setScore(score);
        result.setFeedback(feedback);
        result.setLanguage(lang);
        result.setConfidence(confidence);
        result.setStudentId(attempt.getStudentId());
        result.setExamId(attempt.getExamId());
        result.setEvaluationMethod(overallMethod);
        result.setGradedAt(new java.util.Date());
        result.setAnswersHash(currentAnswersHash); // ✅ Lưu hash để validate cache lần sau

        result.setDetails(jsonService.toJson(gradingResults));

        aiResultRepository.save(result);
        logger.info("Exam evaluation completed for attemptId: {}, score: {}", attemptId, score);

        // Gọi callback về exam_service ch update điểm số (Async)
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO detailedResult = new com.igcse.ai.dto.aiChamDiem.DetailedGradingResultDTO(
                        attemptId,
                        score,
                        maxScore,
                        feedback,
                        confidence,
                        lang,
                        gradingResults);

                boolean callbackSuccess = examServiceClient.updateGradingResult(attemptId, detailedResult);
                if (callbackSuccess) {
                    logger.info("Successfully sent grading result callback to exam service for attemptId: {}",
                            attemptId);
                } else {
                    logger.warn("Failed to send grading result callback to exam service for attemptId: {}", attemptId);
                }
            } catch (Exception e) {
                logger.error("Error sending grading result callback to exam service for attemptId: {}. Error: {}",
                        attemptId, e.getMessage(), e);
            }
        }, taskExecutor);

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

    public DetailedGradingResultDTO getDetailedResult(Long attemptId) {
        logger.debug("Fetching detailed result for attemptId: {}", attemptId);
        Objects.requireNonNull(attemptId, "Attempt ID cannot be null");

        AIResult result = getResult(attemptId);
        List<GradingResult> detailsList = new java.util.ArrayList<>();

        detailsList = jsonService.parseGradingDetails(result.getDetails());

        Double maxScore = 10.0;
        if (!detailsList.isEmpty()) {
            maxScore = gradingService.calculateMaxScore(detailsList);
        }

        return new DetailedGradingResultDTO(
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

    /**
     * Tính MD5 hash của answers JSON để validate cache
     * 
     * @param answersJson JSON string của answers
     * @return Base64 encoded MD5 hash, hoặc null nếu có lỗi
     */
    private String calculateHash(String answersJson) {
        if (answersJson == null || answersJson.isEmpty()) {
            logger.warn("Cannot calculate hash: answersJson is null or empty");
            return null;
        }

        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(answersJson.getBytes(StandardCharsets.UTF_8));
            String hash = Base64.getEncoder().encodeToString(hashBytes);
            logger.debug("Calculated hash for answers: {} (length: {})",
                    hash.substring(0, Math.min(8, hash.length())) + "...", hash.length());
            return hash;
        } catch (NoSuchAlgorithmException e) {
            logger.error("Error calculating hash: MD5 algorithm not found", e);
            return null;
        } catch (Exception e) {
            logger.error("Error calculating hash for answers", e);
            return null;
        }
    }
}
