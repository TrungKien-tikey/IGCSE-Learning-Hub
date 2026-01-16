package com.igcse.ai.service;

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
import com.igcse.ai.service.common.TierManagerService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AIService {
    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private final JsonService jsonService;
    private final AIResultRepository aiResultRepository;
    private final IGradingService gradingService;
    private final ILanguageService languageService;
    private final TierManagerService tierManagerService;

    public AIService(
            JsonService jsonService,
            AIResultRepository aiResultRepository,
            IGradingService gradingService,
            ILanguageService languageService,
            TierManagerService tierManagerService) {
        this.jsonService = jsonService;
        this.aiResultRepository = aiResultRepository;
        this.gradingService = gradingService;
        this.languageService = languageService;
        this.tierManagerService = tierManagerService;
    }

    /**
     * Chấm điểm dựa trên DTO được đẩy sang (Push Mode) - Dùng cho RabbitMQ
     */

    public double evaluateExamFromDTO(ExamAnswersDTO attempt) {
        DetailedGradingResultDTO result = evaluateExamInternal(attempt);
        return result.getScore();
    }

    /**
     * Dùng cho RabbitMQ Listener: Chỉ châm điểm và trả về kết quả, KHÔNG gọi
     * callback REST.
     * Listener sẽ tự gửi message vào queue kết quả.
     */
    public DetailedGradingResultDTO evaluateExamGetResult(ExamAnswersDTO attempt) {
        return evaluateExamInternal(attempt);
    }

    /**
     * Logic chấm điểm cốt lõi (Shared)
     */
    private DetailedGradingResultDTO evaluateExamInternal(ExamAnswersDTO attempt) {
        Long attemptId = attempt.getAttemptId();
        String language = attempt.getLanguage();
        if (language == null)
            language = LanguageService.DEFAULT_LANGUAGE;

        logger.info("Starting exam evaluation (Internal) for attemptId: {}, language: {}", attemptId, language);

        Objects.requireNonNull(attemptId, "Attempt ID cannot be null");

        String lang = languageService.normalizeLanguage(language);

        if (!isValidLanguage(lang)) {
            logger.warn("Invalid language provided: {}", language);
            throw new InvalidLanguageException(language);
        }

        // Kiểm tra cache
        Optional<AIResult> existingResult = aiResultRepository.findByAttemptId(attemptId);
        String answersJson = jsonService.toJson(attempt);
        String currentAnswersHash = calculateHash(answersJson);

        // Validation Cache logic... (giữ nguyên logic check hash cũ)
        if (existingResult.isPresent()) {
            AIResult cachedResult = existingResult.get();
            String cachedHash = cachedResult.getAnswersHash();

            if (lang.equals(cachedResult.getLanguage()) &&
                    currentAnswersHash != null &&
                    currentAnswersHash.equals(cachedHash)) {
                logger.info("✅ Returning cached result for attemptId: {}", attemptId);

                // Reconstruct DTO from cache
                List<GradingResult> detailsList = jsonService.parseGradingDetails(cachedResult.getDetails());
                Double maxScore = 10.0;
                if (!detailsList.isEmpty())
                    maxScore = gradingService.calculateMaxScore(detailsList);

                return new DetailedGradingResultDTO(
                        attemptId, cachedResult.getScore(), maxScore, cachedResult.getFeedback(),
                        cachedResult.getConfidence(), lang, detailsList);
            }
            // else fall through
        }

        // Chấm điểm
        List<GradingResult> gradingResults = gradingService.gradeAllAnswers(attempt.getAnswers(), lang);

        double totalScore = gradingService.calculateTotalScore(gradingResults);
        double maxScore = gradingService.calculateMaxScore(gradingResults);
        double score = maxScore > 0 ? (totalScore / maxScore) * 10.0 : 0.0;
        double confidence = gradingService.calculateAverageConfidence(gradingResults);
        String feedback = gradingService.generateOverallFeedback(gradingResults, lang);

        String overallMethod = "LOCAL_RULE_BASED";
        for (GradingResult r : gradingResults) {
            if ("AI_GPT4_LANGCHAIN".equals(r.getEvaluationMethod())) {
                overallMethod = "AI_GPT4_LANGCHAIN";
                break;
            }
        }

        // ✅ Trích xuất Metadata
        TierManagerService.AnalysisMetadata metadata = tierManagerService.extractMetadata(attempt.getStudentId(), null);

        // Lưu DB
        AIResult result = existingResult.orElse(new AIResult(attemptId, score, feedback, lang, confidence));
        result.setScore(score);
        result.setFeedback(feedback);
        result.setLanguage(lang);
        result.setConfidence(confidence);
        result.setStudentId(attempt.getStudentId());
        result.setExamId(attempt.getExamId());
        result.setEvaluationMethod(overallMethod);
        result.setGradedAt(new java.util.Date());
        result.setAnswersHash(currentAnswersHash);
        result.setDetails(jsonService.toJson(gradingResults));

        // Lưu Metadata vào AIResult
        if (metadata != null) {
            result.setStudentName(metadata.studentName());
        }

        aiResultRepository.save(result);
        logger.info("Exam evaluation completed for attemptId: {}, score: {}", attemptId, score);

        // Invalidate cache (Đã chuyển sang TierManagerService kiểm soát Tầng 2)
        // Không xóa DB bừa bãi ở đây nữa để tránh mất lịch sử Tầng 2 khi chưa đủ bài
        // thi

        return new DetailedGradingResultDTO(
                attemptId, score, maxScore, feedback, confidence, lang, gradingResults);
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

    @Transactional
    public void updateComponentScores(Long attemptId, Double mcScore, Double essayScore, Long classId) {
        logger.info("Updating component scores for attemptId: {}, MC: {}, Essay: {}, Class: {}",
                attemptId, mcScore, essayScore, classId);
        Optional<AIResult> resultOpt = aiResultRepository.findByAttemptId(attemptId);
        if (resultOpt.isPresent()) {
            AIResult result = resultOpt.get();
            result.setMultipleChoiceScore(mcScore);
            result.setEssayScore(essayScore);
            if (classId != null) {
                result.setClassId(classId);
            }
            aiResultRepository.save(result);
        }
    }
}
