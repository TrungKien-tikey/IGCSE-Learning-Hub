package com.igcse.ai.service.common;

import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.entity.AIRecommendation;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIRecommendationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TierManagerService {
    private static final Logger logger = LoggerFactory.getLogger(TierManagerService.class);

    private final AIRecommendationRepository aiRecommendationRepository;
    private final JsonService jsonService;

    @Value("${ai.analysis.tier2.exam-threshold:3}")
    private int tier2Threshold;

    @Value("${ai.analysis.tier2.score-drop-threshold:0.3}")
    private double scoreDropThreshold;

    public TierManagerService(AIRecommendationRepository aiRecommendationRepository,
            JsonService jsonService) {
        this.aiRecommendationRepository = aiRecommendationRepository;
        this.jsonService = jsonService;
    }

    /**
     * Dữ liệu phân tích dùng chung
     */
    public record AnalysisData(
            double avgScore,
            double passRate,
            int totalExams,
            double highestScore,
            double lowestScore,
            List<String> strengths,
            List<String> weaknesses) {
    }

    /**
     * DTO chứa metadata từ NiFi
     */
    public record AnalysisMetadata(
            String studentName,
            String persona) {
        public static AnalysisMetadata defaultMetadata() {
            return new AnalysisMetadata("Học sinh", "default");
        }
    }

    /**
     * Kiểm tra xem dữ liệu có thay đổi so với lần phân tích gần nhất không.
     * Trả về true nếu có bài thi mới hoặc điểm số thay đổi.
     */
    @Transactional(readOnly = true)
    public boolean isNewData(Long studentId, AnalysisData data) {
        Optional<AIRecommendation> latestOpt = aiRecommendationRepository
                .findTopByStudentIdOrderByGeneratedAtDesc(studentId);

        if (latestOpt.isPresent()) {
            AIRecommendation latest = latestOpt.get();
            // Nếu số lượng bài thi và điểm trung bình phân tích lần trước giữ nguyên ->
            // Không có dữ liệu mới
            if (latest.getAvgScoreAnalyzed() != null && latest.getTotalExamsAnalyzed() != null) {
                if (latest.getAvgScoreAnalyzed().equals(data.avgScore()) &&
                        latest.getTotalExamsAnalyzed() == data.totalExams()) {
                    logger.debug("Dữ liệu cho student {} không đổi so với bản Recommendation gần nhất.", studentId);
                    return false;
                }
            }
        }

        logger.info("New data detected for student {}. Total exams: {}", studentId, data.totalExams());
        return true;
    }

    public AnalysisData analyzeResults(List<AIResult> results) {
        if (results.isEmpty())
            return new AnalysisData(0, 0, 0, 0, 0, List.of(), List.of());

        double averageScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average().orElse(0.0);

        double maxScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .max().orElse(0.0);

        double minScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .min().orElse(0.0);

        long passCount = results.stream().filter(AIResult::isPassed).count();
        double passRate = (double) passCount / results.size() * 100;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();

        for (AIResult r : results) {
            List<GradingResult> details = jsonService.parseGradingDetails(r.getDetails());
            for (GradingResult gr : details) {
                if (gr.getScore() != null && gr.getMaxScore() != null && gr.getMaxScore() > 0) {
                    double pct = (gr.getScore() / gr.getMaxScore()) * 100;
                    if (pct >= 80)
                        strengths.add("Câu " + gr.getQuestionId());
                    else if (pct < 50)
                        weaknesses.add("Câu " + gr.getQuestionId());
                }
            }
        }

        return new AnalysisData(
                averageScore, passRate, results.size(), maxScore, minScore,
                strengths.stream().distinct().limit(5).collect(Collectors.toList()),
                weaknesses.stream().distinct().limit(5).collect(Collectors.toList()));
    }

    /**
     * Trích xuất metadata (Tên, Persona) từ chuỗi JSON NiFi gửi sang.
     */
    public AnalysisMetadata extractMetadata(Long studentId, String nifiData) {
        if (nifiData == null || nifiData.isEmpty()) {
            return AnalysisMetadata.defaultMetadata();
        }

        try {
            List<Map<String, Object>> records = jsonService.getObjectMapper().readValue(
                    nifiData, new TypeReference<List<Map<String, Object>>>() {
                    });
            for (Map<String, Object> record : records) {
                Object sid = record.get("user_id");
                if (sid == null)
                    sid = record.get("studentId");

                if (sid != null && studentId.equals(Long.valueOf(sid.toString()))) {
                    String persona = "default";
                    if (record.containsKey("mode"))
                        persona = record.get("mode").toString();
                    else if (record.containsKey("persona"))
                        persona = record.get("persona").toString();

                    return new AnalysisMetadata("Học sinh", persona);
                }
            }
        } catch (Exception e) {
            logger.warn("Could not parse nifiData for metadata: {}", e.getMessage());
        }
        return AnalysisMetadata.defaultMetadata();
    }

    /**
     * Chuyển đổi dữ liệu phân tích thô thành văn bản tóm tắt để gửi cho AI.
     */
    public String buildTextSummary(AnalysisData data) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Học sinh có %d bài thi. Điểm TB: %.2f/10. Tỷ lệ đạt: %.1f%%. ",
                data.totalExams(), data.avgScore(), data.passRate()));

        if (!data.strengths().isEmpty()) {
            sb.append("Điểm mạnh: ").append(String.join(", ", data.strengths())).append(". ");
        }
        if (!data.weaknesses().isEmpty()) {
            sb.append("Cần cải thiện: ").append(String.join(", ", data.weaknesses())).append(". ");
        }
        return sb.toString();
    }
}
