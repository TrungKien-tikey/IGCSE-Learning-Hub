package com.igcse.ai.service.goiyLoTrinhHoc;

import com.igcse.ai.service.common.ILanguageService;
import com.igcse.ai.service.common.JsonService;
import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.entity.AIRecommendation;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.repository.AIRecommendationRepository;
import com.igcse.ai.service.common.TierManagerService;
import com.igcse.ai.service.llm.RecommendationAiService;
import com.igcse.ai.client.CourseClient;
import com.igcse.ai.dto.external.CourseDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService implements IRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    private final AIResultRepository aiResultRepository;
    private final AIRecommendationRepository aiRecommendationRepository;
    private final JsonService jsonService;
    private final ILanguageService languageService;
    private final TierManagerService tierManagerService;
    private final RecommendationAiService recommendationAiService;
    private final CourseClient courseClient;

    public RecommendationService(AIResultRepository aiResultRepository,
            RecommendationAiService recommendationAiService, JsonService jsonService,
            ILanguageService languageService,
            AIRecommendationRepository aiRecommendationRepository,
            TierManagerService tierManagerService,
            CourseClient courseClient) {
        this.aiResultRepository = aiResultRepository;
        this.recommendationAiService = recommendationAiService;
        this.jsonService = jsonService;
        this.languageService = languageService;
        this.aiRecommendationRepository = aiRecommendationRepository;
        this.tierManagerService = tierManagerService;
        this.courseClient = courseClient;
    }

    /**
     * Lấy gợi ý học tập (Learning Recommendation) cho học sinh.
     * Ưu tiên lấy từ cache nếu dữ liệu bài thi không thay đổi.
     * 
     * @param studentId ID của học sinh
     * @return DTO chứa lộ trình học tập, chủ đề mạnh/yếu và tài nguyên khuyến nghị.
     */
    @Override
    public LearningRecommendationDTO getRecommendations(Long studentId) {
        logger.info("Getting recommendations for studentId: {}", studentId);
        Objects.requireNonNull(studentId, "Student ID cannot be null");

        Optional<AIRecommendation> cached = aiRecommendationRepository
                .findTopByStudentIdOrderByGeneratedAtDesc(studentId);
        if (cached.isPresent()) {
            List<AIResult> results = aiResultRepository.findByStudentId(studentId);
            if (results.isEmpty()) {
                logger.info("Student {} has no exam results but has cached AI recommendation. Returning cache.",
                        studentId);
                return convertToDTO(cached.get());
            }

            TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);
            boolean isNewData = tierManagerService.isNewData(studentId, analysis);

            if (!isNewData) {
                logger.info("Returning latest cached recommendation for studentId: {}", studentId);
                return convertToDTO(cached.get());
            }
        } else {
            // Chưa có cache và chưa có bài thi -> trả về empty
            List<AIResult> results = aiResultRepository.findByStudentId(studentId);
            if (results.isEmpty()) {
                logger.debug("No recommendations and no exam results for studentId: {}", studentId);
                return createEmptyRecommendation(studentId);
            }
        }

        return refreshRecommendation(studentId, null);
    }

    /**
     * Kích hoạt cập nhật gợi ý thủ công hoặc từ luồng dữ liệu NiFi.
     * 
     * @param studentId ID học sinh
     * @param nifiData  Chuỗi JSON chứa metadata từ NiFi
     */
    @Override
    public void triggerUpdate(Long studentId, String nifiData) {
        logger.info("Manual trigger update for studentId: {} with data size: {}",
                studentId, (nifiData != null ? nifiData.length() : "null"));
        refreshRecommendation(studentId, nifiData);
    }

    @Transactional
    private LearningRecommendationDTO refreshRecommendation(Long studentId, String nifiData) {
        List<AIResult> results = aiResultRepository.findByStudentId(studentId);
        TierManagerService.AnalysisData analysis = tierManagerService.analyzeResults(results);

        boolean isNewData = tierManagerService.isNewData(studentId, analysis);

        if (!isNewData) {
            return aiRecommendationRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElseGet(() -> createEmptyRecommendation(studentId));
        }

        logger.info(">>> Triggering AI Recommendation Synthesis for studentId: {}", studentId);

        // Tránh xử lý song song
        if (!tierManagerService.startProcessing(studentId)) {
            logger.warn("Analysis already in progress for student: {}. Skipping.", studentId);
            return aiRecommendationRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                    .map(this::convertToDTO)
                    .orElseGet(() -> createEmptyRecommendation(studentId));
        }

        try {
            AIResult latestResult = results.stream()
                    .max(Comparator.comparing(AIResult::getGradedAt))
                    .orElse(null);
            TierManagerService.AnalysisMetadata metadata = tierManagerService.extractMetadata(studentId, nifiData,
                    latestResult);

            // Lấy các bản gợi ý cũ làm ngữ cảnh
            List<AIRecommendation> recentLogics = aiRecommendationRepository
                    .findTop5ByStudentIdOrderByGeneratedAtDesc(studentId);

            String logContext = recentLogics.stream()
                    .limit(3)
                    .map(AIRecommendation::getLearningPathSuggestion)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining("\n---\n"));

            // Lấy bản AI chuyên sâu gần nhất làm bối cảnh (Context)
            String aiContext = aiRecommendationRepository
                    .findTopByStudentIdAndIsAiGeneratedTrueOrderByGeneratedAtDesc(studentId)
                    .map(AIRecommendation::getLearningPathSuggestion)
                    .orElse("Đây là lần đầu tiên xây dựng lộ trình chuyên sâu.");

            String combinedSummary = "Dữ liệu thống kê cho khóa học [" + metadata.lastCourseName() + "]: " +
                    tierManagerService.buildTextSummary(analysis) +
                    "\n\n--- CÁC GỢI Ý LOGIC GẦN ĐÂY ---\n" + logContext +
                    "\n\n--- LỘ TRÌNH CHUYÊN SÂU TRƯỚC ĐÓ ---\n" + aiContext +
                    "\n\nHãy phân tích sự thay đổi và cập nhật lộ trình học tập mới nhất.";

            String aiLanguageName = languageService.getAiLanguageName("vi");

            // Fetch available courses for context
            List<CourseDTO> courses = courseClient.getAllCourses();
            String coursesText = courses.stream()
                    .map(c -> String.format("- id: %d, title: %s, description: %s",
                            c.getCourseId(), c.getTitle(), c.getDescription()))
                    .collect(Collectors.joining("\n"));

            LearningRecommendationDTO synthesisResult = null;
            try {
                synthesisResult = recommendationAiService.generateRecommendation(
                        combinedSummary, metadata.studentName(), metadata.personaInfo(), coursesText, aiLanguageName);
            } catch (Exception e) {
                logger.error("LLM Call failed for recommendation synthesis: {}", e.getMessage());
            }

            if (synthesisResult != null) {
                synthesisResult.setStudentId(studentId);
                // Lưu kết quả AI kèm snapshot dữ liệu để theo dõi thay đổi sau này
                AIRecommendation aiEntity = saveRecommendationToCacheInternal(synthesisResult, true, analysis,
                        metadata);

                return convertToDTO(aiEntity);
            }
        } catch (Exception e) {
            logger.error("AI Recommendation Synthesis failed for student {}: {}", studentId, e.getMessage());
        } finally {
            tierManagerService.stopProcessing(studentId);
        }

        return createEmptyRecommendation(studentId);
    }

    /**
     * Lưu thông tin gợi ý AI vào cơ sở dữ liệu làm bộ nhớ đệm (Cache).
     */
    private AIRecommendation saveRecommendationToCacheInternal(LearningRecommendationDTO dto, boolean isAiGenerated,
            TierManagerService.AnalysisData analysis, TierManagerService.AnalysisMetadata metadata) {
        AIRecommendation entity = new AIRecommendation();
        entity.setStudentId(dto.getStudentId());
        entity.setLearningPathSuggestion(dto.getLearningPathSuggestion());
        entity.setIsAiGenerated(isAiGenerated);
        entity.setLanguage("vi");
        entity.setGeneratedAt(new Date());

        // Lưu Metadata
        if (metadata != null) {
            entity.setStudentName(metadata.studentName());
        }

        // Lưu snapshot dữ liệu bài thi được dùng để phân tích
        if (analysis != null) {
            entity.setTotalExamsAnalyzed(analysis.totalExams());
            entity.setAvgScoreAnalyzed(analysis.avgScore());
        }

        try {
            if (dto.getWeakTopics() != null)
                entity.setWeakTopics(jsonService.toJson(dto.getWeakTopics()));
            if (dto.getStrongTopics() != null)
                entity.setStrongTopics(jsonService.toJson(dto.getStrongTopics()));
            if (dto.getRecommendedResources() != null)
                entity.setRecommendedResources(jsonService.toJson(dto.getRecommendedResources()));
        } catch (Exception e) {
            logger.error("Error serializing JSON for recommendation synthesis", e);
        }

        return aiRecommendationRepository.save(entity);
    }

    /**
     * Tạo đối tượng gợi ý rỗng khi học sinh chưa có đủ dữ liệu bài thi.
     */
    private LearningRecommendationDTO createEmptyRecommendation(Long studentId) {
        LearningRecommendationDTO rec = new LearningRecommendationDTO();
        rec.setStudentId(studentId);
        rec.setWeakTopics(new ArrayList<>());
        rec.setStrongTopics(new ArrayList<>());
        rec.setRecommendedResources(new ArrayList<>());
        rec.setLearningPathSuggestion("Vui lòng hoàn thành bài thi để nhận được gợi ý học tập.");
        return rec;
    }

    /**
     * Chuyển đổi dữ liệu và xử lý các mảng JSON khi đọc từ Database lên.
     */
    private LearningRecommendationDTO convertToDTO(AIRecommendation entity) {
        LearningRecommendationDTO dto = new LearningRecommendationDTO();
        dto.setStudentId(entity.getStudentId());
        dto.setLearningPathSuggestion(entity.getLearningPathSuggestion());

        // Đảm bảo các List không bao giờ null
        dto.setWeakTopics(new ArrayList<>());
        dto.setStrongTopics(new ArrayList<>());
        dto.setRecommendedResources(new ArrayList<>());
        dto.setRoadmapSteps(new ArrayList<>());

        try {
            if (entity.getWeakTopics() != null && !entity.getWeakTopics().isEmpty()) {
                dto.setWeakTopics(jsonService.getObjectMapper().readValue(entity.getWeakTopics(),
                        new TypeReference<List<String>>() {
                        }));
            }
            if (entity.getStrongTopics() != null && !entity.getStrongTopics().isEmpty()) {
                dto.setStrongTopics(jsonService.getObjectMapper().readValue(entity.getStrongTopics(),
                        new TypeReference<List<String>>() {
                        }));
            }
            if (entity.getRecommendedResources() != null && !entity.getRecommendedResources().isEmpty()) {
                dto.setRecommendedResources(jsonService.getObjectMapper().readValue(entity.getRecommendedResources(),
                        new TypeReference<List<String>>() {
                        }));
            }
        } catch (

        Exception e) {
            logger.error("Error parsing JSON in cached recommendation", e);
        }

        return dto;
    }
}
