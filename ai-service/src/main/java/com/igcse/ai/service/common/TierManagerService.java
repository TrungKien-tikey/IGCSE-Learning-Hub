package com.igcse.ai.service.common;

import com.igcse.ai.dto.aiChamDiem.GradingResult;
import com.igcse.ai.entity.AIRecommendation;
import com.igcse.ai.entity.AIInsight;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIRecommendationRepository;
import com.igcse.ai.repository.AIInsightRepository;
import com.igcse.ai.repository.StudyContextRepository;
import com.igcse.ai.entity.StudyContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TierManagerService {
    private static final Logger logger = LoggerFactory.getLogger(TierManagerService.class);

    private final AIRecommendationRepository aiRecommendationRepository;
    private final AIInsightRepository aiInsightRepository;
    private final StudyContextRepository studyContextRepository;
    private final JsonService jsonService;

    // Bộ nhớ tạm để tránh phân tích song song cho cùng một học sinh
    private final Set<Long> processingStudents = Collections.synchronizedSet(new HashSet<>());

    // Cooldown mặc định (mili giây) - 3 phút
    private static final long ANALYSIS_COOLDOWN_MS = 3 * 60 * 1000;

    public TierManagerService(AIRecommendationRepository aiRecommendationRepository,
            AIInsightRepository aiInsightRepository,
            StudyContextRepository studyContextRepository,
            JsonService jsonService) {
        this.aiRecommendationRepository = aiRecommendationRepository;
        this.aiInsightRepository = aiInsightRepository;
        this.studyContextRepository = studyContextRepository;
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
            List<String> weaknesses,
            Double avgDurationSeconds) {
    }

    /**
     * DTO chứa metadata từ NiFi
     */
    public record AnalysisMetadata(
            String studentName,
            String personaInfo,
            String lastCourseName,
            Long classId) {
        public static AnalysisMetadata defaultMetadata() {
            return new AnalysisMetadata("Học sinh", "Chưa có thông tin bối cảnh.", "Khóa học IGCSE", null);
        }
    }

    /**
     * Kiểm tra xem dữ liệu có thay đổi so với lần phân tích Recommendation gần nhất
     * không.
     * Trả về true nếu có bài thi mới hoặc điểm số thay đổi.
     */
    @Transactional(readOnly = true)
    public boolean isNewData(Long studentId, AnalysisData data) {
        Optional<AIRecommendation> latestOpt = aiRecommendationRepository
                .findTopByStudentIdOrderByGeneratedAtDesc(studentId);

        if (latestOpt.isPresent()) {
            AIRecommendation latest = latestOpt.get();

            // 1. Kiểm tra Cooldown (Ví dụ: 3 phút)
            long timeSinceLastAnalysis = System.currentTimeMillis() - latest.getGeneratedAt().getTime();
            if (timeSinceLastAnalysis < ANALYSIS_COOLDOWN_MS) {
                logger.debug("Học sinh {} vừa được phân tích cách đây {}ms. Bỏ qua (Cooldown).", studentId,
                        timeSinceLastAnalysis);
                return false;
            }

            // 2. Kiểm tra thay đổi dữ liệu
            if (latest.getAvgScoreAnalyzed() != null && latest.getTotalExamsAnalyzed() != null) {
                // Sử dụng tolerance 0.01 để tránh sai lệch nhỏ do số thực (double)
                boolean scoreMatch = Math.abs(latest.getAvgScoreAnalyzed() - data.avgScore()) < 0.01;
                boolean countMatch = latest.getTotalExamsAnalyzed() == data.totalExams();

                if (scoreMatch && countMatch) {
                    logger.debug("Dữ liệu cho student {} không đổi (Recommendation). Cache HIT.", studentId);
                    return false;
                }
            }
        }

        logger.info("New data detected for student {}. Total exams: {}", studentId, data.totalExams());
        return true;
    }

    /**
     * Quản lý trạng thái đang xử lý để tránh gọi AI song song cho cùng 1 học sinh.
     */
    public boolean startProcessing(Long studentId) {
        return processingStudents.add(studentId);
    }

    public void stopProcessing(Long studentId) {
        processingStudents.remove(studentId);
    }

    /**
     * Kiểm tra xem dữ liệu có thay đổi so với lần phân tích Insight gần nhất không.
     * Trả về true nếu có bài thi mới hoặc điểm số thay đổi.
     */
    @Transactional(readOnly = true)
    public boolean isNewDataForInsight(Long studentId, AnalysisData data) {
        Optional<AIInsight> latestOpt = aiInsightRepository
                .findTopByStudentIdOrderByGeneratedAtDesc(studentId);

        if (latestOpt.isPresent()) {
            AIInsight latest = latestOpt.get();

            // 1. Kiểm tra Cooldown
            long timeSinceLastAnalysis = System.currentTimeMillis() - latest.getGeneratedAt().getTime();
            if (timeSinceLastAnalysis < ANALYSIS_COOLDOWN_MS) {
                logger.debug("Học sinh {} vừa được phân tích Insight cách đây {}ms. Bỏ qua (Cooldown).", studentId,
                        timeSinceLastAnalysis);
                return false;
            }

            // 2. Kiểm tra thay đổi dữ liệu
            if (latest.getAvgScoreAnalyzed() != null && latest.getTotalExamsAnalyzed() != null) {
                // Sử dụng tolerance 0.01 cho so sánh số thực
                boolean scoreMatch = Math.abs(latest.getAvgScoreAnalyzed() - data.avgScore()) < 0.01;
                boolean countMatch = latest.getTotalExamsAnalyzed() == data.totalExams();

                if (scoreMatch && countMatch) {
                    logger.debug("Dữ liệu cho student {} không đổi (Insight). Cache HIT.", studentId);
                    return false;
                }
            }
        }

        logger.info("New data detected for student {} (Insight). Total exams: {}", studentId, data.totalExams());
        return true;
    }

    public AnalysisData analyzeResults(List<AIResult> results) {
        if (results.isEmpty())
            return new AnalysisData(0, 0, 0, 0, 0, List.of(), List.of(), 0.0);

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

                    // Ưu tiên Topic/AO, nếu không có mới dùng Question ID
                    String identifier = gr.getTopic() != null ? gr.getTopic()
                            : (gr.getAssessmentObjective() != null ? gr.getAssessmentObjective()
                                    : "Câu " + gr.getQuestionId());

                    if (pct >= 80)
                        strengths.add(identifier);
                    else if (pct < 50)
                        weaknesses.add(identifier);
                }
            }
        }

        double averageDuration = results.stream()
                .filter(r -> r.getDetails() != null)
                .mapToDouble(r -> {
                    try {
                        // Giả sử NiFi gán duration_seconds vào metadata trong JSON details
                        Map<String, Object> meta = jsonService.getObjectMapper().readValue(r.getDetails(),
                                new TypeReference<Map<String, Object>>() {
                                });
                        return meta.containsKey("duration_seconds")
                                ? Double.valueOf(meta.get("duration_seconds").toString())
                                : 0.0;
                    } catch (Exception e) {
                        return 0.0;
                    }
                })
                .filter(d -> d > 0)
                .average().orElse(0.0);

        return new AnalysisData(
                averageScore, passRate, results.size(), maxScore, minScore,
                strengths.stream().distinct().limit(10).collect(Collectors.toList()),
                weaknesses.stream().distinct().limit(10).collect(Collectors.toList()),
                averageDuration);
    }

    /**
     * Trích xuất metadata (Tên, Persona) từ chuỗi JSON NiFi gửi sang.
     * LUỒNG ƯU TIÊN:
     * 1. Kiểm tra bảng `study_contexts` (Dữ liệu đã được lưu bền vững).
     * 2. Nếu không có, thử parse trực tiếp từ `nifiData` truyền vào (Dữ liệu tạm
     * thời).
     * 3. Nếu vẫn không có, lấy từ bản ghi AIRecommendation gần nhất.
     */
    public AnalysisMetadata extractMetadata(Long studentId, String nifiData) {
        // Ưu tiên 1: Lấy từ bảng study_contexts
        Optional<StudyContext> storedContext = studyContextRepository.findByStudentId(studentId);
        if (storedContext.isPresent()) {
            logger.debug("Sử dụng bối cảnh đã lưu từ database cho student: {}", studentId);
            String storedName = storedContext.get().getStudentName();
            String persona = storedContext.get().getPersona();
            String contextJson = storedContext.get().getContextData();

            // Ưu tiên lấy courseTitle trực tiếp từ entity (đã được lưu từ NiFi)
            String lastCourse = storedContext.get().getCourseTitle();

            // Fallback: Parse từ contextJson nếu courseTitle chưa có
            if (lastCourse == null || lastCourse.isEmpty()) {
                try {
                    if (contextJson != null) {
                        Map<String, Object> data = jsonService.getObjectMapper().readValue(contextJson,
                                new TypeReference<Map<String, Object>>() {
                                });
                        if (data.containsKey("title"))
                            lastCourse = data.get("title").toString();
                        else if (data.containsKey("course_name"))
                            lastCourse = data.get("course_name").toString();
                    }
                } catch (Exception e) {
                }
            }

            if (lastCourse == null || lastCourse.isEmpty()) {
                lastCourse = "Khóa học IGCSE";
            }

            return new AnalysisMetadata(
                    storedName != null ? storedName : "Học sinh",
                    persona != null ? persona : "Chưa có thông tin bối cảnh.",
                    lastCourse,
                    storedContext.get().getClassId());
        }

        // Ưu tiên 2: Parse từ nifiData
        if (nifiData != null && !nifiData.isEmpty()) {
            try {
                List<Map<String, Object>> records = jsonService.getObjectMapper().readValue(
                        nifiData, new TypeReference<List<Map<String, Object>>>() {
                        });
                for (Map<String, Object> record : records) {
                    Object sid = record.get("user_id");
                    if (sid == null)
                        sid = record.get("studentId");

                    if (sid != null && studentId.equals(Long.valueOf(sid.toString()))) {
                        String studentName = extractString(record, "full_name", "student_name", "name");
                        String courseName = extractString(record, "course_name", "title");
                        return new AnalysisMetadata(
                                studentName != null ? studentName : "Học sinh",
                                "Thông tin bối cảnh tạm thời từ NiFi.",
                                courseName != null ? courseName : "Khóa học IGCSE",
                                extractLong(record, "course_id"));
                    }
                }
            } catch (Exception e) {
            }
        }

        return findLatestMetadata(studentId);
    }

    private AnalysisMetadata findLatestMetadata(Long studentId) {
        return aiRecommendationRepository.findTopByStudentIdOrderByGeneratedAtDesc(studentId)
                .map(r -> new AnalysisMetadata(
                        r.getStudentName() != null ? r.getStudentName() : "Học sinh",
                        "Thông tin bối cảnh từ bản phân tích cũ.",
                        "Khóa học IGCSE",
                        null)) // AIRecommendation does not have classId
                .orElse(AnalysisMetadata.defaultMetadata());
    }

    private String extractString(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            if (record.containsKey(key) && record.get(key) != null) {
                return record.get(key).toString();
            }
        }
        return null;
    }

    /**
     * Chuyển đổi dữ liệu phân tích thô thành văn bản tóm tắt để gửi cho AI.
     */
    public String buildTextSummary(AnalysisData data) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Học sinh có %d bài thi. Điểm TB: %.2f/10. Tỷ lệ đạt: %.1f%%. ",
                data.totalExams(), data.avgScore(), data.passRate()));

        if (data.avgDurationSeconds() != null && data.avgDurationSeconds() > 0) {
            long mins = Math.round(data.avgDurationSeconds() / 60);
            sb.append(String.format("Tốc độ làm bài trung bình: %d phút. ", mins));
        }

        if (!data.strengths().isEmpty()) {
            sb.append("Điểm mạnh: ").append(String.join(", ", data.strengths())).append(". ");
        }
        if (!data.weaknesses().isEmpty()) {
            sb.append("Cần cải thiện: ").append(String.join(", ", data.weaknesses())).append(". ");
        }
        return sb.toString();
    }

    private Long extractLong(Map<String, Object> record, String key) {
        if (record.containsKey(key) && record.get(key) != null) {
            try {
                return Long.valueOf(record.get(key).toString());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
