package com.igcse.ai.service.thongKe;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;
import com.igcse.ai.dto.thongKe.LearningAnalyticsDTO;
import com.igcse.ai.dto.thongKe.ParentSummaryDTO;
import com.igcse.ai.dto.thongKe.StudentStatisticsDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import com.igcse.ai.service.common.TierManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService implements IStatisticsService {

        private static final Logger logger = LoggerFactory.getLogger(StatisticsService.class);

        private final AIResultRepository aiResultRepository;
        private final TierManagerService tierManagerService;

        public StatisticsService(AIResultRepository aiResultRepository,
                        TierManagerService tierManagerService) {
                this.aiResultRepository = aiResultRepository;
                this.tierManagerService = tierManagerService;
        }

        @Override
        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public StudentStatisticsDTO getStudentStatistics(Long studentId) {
                logger.info("Getting optimized statistics for studentId: {}", studentId);
                Objects.requireNonNull(studentId, "Student ID cannot be null");

                // 1. Lấy tổng số bài thi bằng aggregation
                Long totalExams = aiResultRepository.countByStudentId(studentId);
                if (totalExams == null || totalExams == 0) {
                        logger.debug("No results found for studentId: {}", studentId);
                        return createEmptyStats(studentId);
                }

                StudentStatisticsDTO stats = new StudentStatisticsDTO();
                stats.setStudentId(studentId);
                stats.setTotalExams(totalExams.intValue());

                // 2. Lấy Max/Min/Avg trực tiếp từ DB
                Double avg = aiResultRepository.getAverageScoreByStudentId(studentId);
                Double max = aiResultRepository.getMaxScoreByStudentId(studentId);
                Double min = aiResultRepository.getMinScoreByStudentId(studentId);

                stats.setAverageScore(avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);
                stats.setHighestScore(max != null ? max : 0.0);
                stats.setLowestScore(min != null ? min : 0.0);

                // 3. Tính Improvement Rate bằng aggregation theo khoảng thời gian
                Date now = Date.from(Instant.now());
                Date oneMonthAgo = Date.from(Instant.now().minus(30, ChronoUnit.DAYS));
                Date twoMonthsAgo = Date.from(Instant.now().minus(60, ChronoUnit.DAYS));

                Double recentAvg = aiResultRepository.getAverageScoreByStudentIdAndDateRange(studentId, oneMonthAgo,
                                now);
                Double previousAvg = aiResultRepository.getAverageScoreByStudentIdAndDateRange(studentId, twoMonthsAgo,
                                oneMonthAgo);

                double improvementRate = 0.0;
                if (recentAvg != null && previousAvg != null && previousAvg > 0) {
                        improvementRate = ((recentAvg - previousAvg) / previousAvg) * 100.0;
                }
                stats.setImprovementRate(Math.round(improvementRate * 100.0) / 100.0);

                // 4. Lấy metadata 1 LẦN THÔI (tối ưu: tránh gọi DB 2 lần)
                TierManagerService.AnalysisMetadata meta = tierManagerService.extractMetadata(studentId, null, null);

                // 5. Lấy kết quả bài thi để xử lý recentExams và subjectPerformance
                List<AIResult> results = aiResultRepository.findByStudentId(studentId);

                // 6. Tên học sinh: ưu tiên từ AIResult, fallback từ metadata
                String studentName = results.stream()
                                .map(AIResult::getStudentName)
                                .filter(Objects::nonNull)
                                .findFirst()
                                .orElseGet(() -> meta != null ? meta.studentName() : "Học sinh");
                stats.setStudentName(studentName);

                // 7. Subject performance
                Map<String, Double> subjectPerformance = results.stream()
                                .filter(r -> r.getExamId() != null)
                                .collect(Collectors.groupingBy(
                                                r -> "Exam " + r.getExamId(),
                                                Collectors.averagingDouble(
                                                                r -> r.getScore() != null ? r.getScore() : 0.0)));
                stats.setSubjectPerformance(subjectPerformance);

                // 8. Persona Badge (dùng lại metadata đã lấy ở bước 4)
                if (meta != null && meta.personaInfo() != null && !meta.personaInfo().isEmpty()) {
                        stats.setPersona(meta.personaInfo());
                }

                // 9. Recent Exams - Top 5 bài thi mới nhất
                List<StudentStatisticsDTO.ExamStat> recentExams = results.stream()
                                .filter(r -> r.getGradedAt() != null)
                                .sorted((a, b) -> b.getGradedAt().compareTo(a.getGradedAt()))
                                .limit(5)
                                .map(r -> new StudentStatisticsDTO.ExamStat(
                                                r.getAttemptId(),
                                                "Exam " + r.getExamId(),
                                                r.getScore(),
                                                r.getMultipleChoiceScore(),
                                                r.getEssayScore(),
                                                r.getGradedAt()))
                                .collect(Collectors.toList());
                stats.setRecentExams(recentExams);

                logger.debug("Statistics calculated for studentId: {}, totalExams: {}, averageScore: {}",
                                studentId, stats.getTotalExams(), stats.getAverageScore());

                return stats;
        }

        private StudentStatisticsDTO createEmptyStats(Long studentId) {
                StudentStatisticsDTO stats = new StudentStatisticsDTO();
                stats.setStudentId(studentId);
                stats.setTotalExams(0);
                stats.setAverageScore(0.0);
                stats.setHighestScore(0.0);
                stats.setLowestScore(0.0);
                stats.setImprovementRate(0.0);
                stats.setSubjectPerformance(new HashMap<>());
                TierManagerService.AnalysisMetadata meta = tierManagerService.extractMetadata(studentId, null, null);
                stats.setStudentName(meta != null ? meta.studentName() : "Học sinh");
                return stats;
        }

        @Override
        public ClassStatisticsDTO getClassStatistics(Long classId) {
                logger.info("Getting statistics for classId: {}", classId);
                Objects.requireNonNull(classId, "Class ID cannot be null");

                ClassStatisticsDTO stats = new ClassStatisticsDTO();
                stats.setClassId(classId);
                stats.setClassName("Class " + classId);

                // ✅ Tối ưu: Dùng aggregation queries thay vì findAll()
                Long totalStudents = aiResultRepository.countDistinctStudentsByClassId(classId);
                Double averageScore = aiResultRepository.getAverageScoreByClassId(classId);
                Long completedAssignments = aiResultRepository.countByClassId(classId);

                stats.setTotalStudents(totalStudents != null ? totalStudents.intValue() : 0);
                stats.setClassAverageScore(averageScore != null ? Math.round(averageScore * 100.0) / 100.0 : 0.0);
                stats.setCompletedAssignments(completedAssignments != null ? completedAssignments.intValue() : 0);

                logger.debug("Class statistics calculated for classId: {}, totalStudents: {}, averageScore: {}",
                                classId, stats.getTotalStudents(), stats.getClassAverageScore());

                return stats;
        }

        @Override
        public Map<String, Object> getSystemStatistics() {
                logger.info("Getting system statistics");

                Map<String, Object> stats = new HashMap<>();

                // ✅ Tối ưu: Dùng count() thay vì findAll().size()
                long totalGraded = aiResultRepository.count();
                stats.put("totalGraded", totalGraded);

                // ✅ Tối ưu: Dùng aggregation query thay vì load toàn bộ data
                Double avgConfidence = aiResultRepository.getAverageConfidence();
                if (avgConfidence != null) {
                        stats.put("averageAccuracy", Math.round(avgConfidence * 10000.0) / 100.0);
                } else {
                        stats.put("averageAccuracy", 0.0);
                }

                // Estimate hours saved (giả định mỗi bài chấm thủ công mất 10 phút)
                double hoursSaved = (totalGraded * 10.0) / 60.0;
                stats.put("hoursSaved", Math.round(hoursSaved * 100.0) / 100.0);

                logger.debug("System statistics: totalGraded={}, hoursSaved={}", totalGraded, stats.get("hoursSaved"));

                return stats;
        }

        @Override
        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public LearningAnalyticsDTO getLearningAnalytics(Long studentId) {
                Objects.requireNonNull(studentId, "Student ID cannot be null");
                List<AIResult> results = aiResultRepository.findByStudentId(studentId);

                List<LearningAnalyticsDTO.CurvePoint> curve = new ArrayList<>();
                List<LearningAnalyticsDTO.EffortPoint> efforts = new ArrayList<>();
                List<LearningAnalyticsDTO.BehaviorFlag> flags = new ArrayList<>();

                for (AIResult r : results) {
                        if (r.getGradedAt() == null || r.getScore() == null)
                                continue;

                        // 1. Curve Point
                        curve.add(new LearningAnalyticsDTO.CurvePoint(
                                        r.getGradedAt(),
                                        r.getScore(),
                                        "Exam " + (r.getExamId() != null ? r.getExamId() : "?")));

                        // 2. Effort Point (Parse duration from JSON)
                        int duration = extractDurationFromDetails(r.getDetails());
                        if (duration > 0) {
                                efforts.add(new LearningAnalyticsDTO.EffortPoint(
                                                r.getAttemptId(),
                                                r.getScore(),
                                                duration,
                                                1800 // Default benchmark: 30 mins
                                ));

                                // 3. Cheat Detection Logic
                                if (r.getScore() >= 8.0 && duration < 300) { // High score in < 5 mins
                                        flags.add(new LearningAnalyticsDTO.BehaviorFlag(
                                                        "RUSHED_HIGH_SCORE",
                                                        "Point " + r.getScore() + " achieved in only " + (duration / 60)
                                                                        + " minutes.",
                                                        "HIGH"));
                                } else if (r.getScore() < 5.0 && duration < 120) { // Low score & rushed
                                        flags.add(new LearningAnalyticsDTO.BehaviorFlag(
                                                        "RUSHED_LOW_SCORE",
                                                        "Submitted too quickly without checking.",
                                                        "MEDIUM"));
                                }
                        }
                }

                // Sort curve by date
                curve.sort(Comparator.comparing(LearningAnalyticsDTO.CurvePoint::getDate));

                return new LearningAnalyticsDTO(studentId, curve, efforts, flags);
        }

        @Override
        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public ParentSummaryDTO getParentSummary(Long studentId) {
                StudentStatisticsDTO basicStats = getStudentStatistics(studentId);
                LearningAnalyticsDTO analytics = getLearningAnalytics(studentId);

                ParentSummaryDTO summary = new ParentSummaryDTO();
                summary.setStudentId(studentId);
                summary.setStudentName(basicStats.getStudentName());

                // 1. Status Logic
                double avg = basicStats.getAverageScore();
                if (avg >= 8.0)
                        summary.setAcademicStatus("Xuất sắc");
                else if (avg >= 6.5)
                        summary.setAcademicStatus("Tốt");
                else if (avg >= 5.0)
                        summary.setAcademicStatus("Cần cố gắng");
                else
                        summary.setAcademicStatus("Cần hỗ trợ (Yếu)");

                // 2. Trend Logic
                if (basicStats.getImprovementRate() > 5.0)
                        summary.setTrendSummary("Đang tiến bộ rõ rệt (+" + basicStats.getImprovementRate() + "%)");
                else if (basicStats.getImprovementRate() < -5.0)
                        summary.setTrendSummary("Đang có dấu hiệu sa sút (" + basicStats.getImprovementRate() + "%)");
                else
                        summary.setTrendSummary("Sức học ổn định");

                // 3. Alerts
                List<String> alerts = new ArrayList<>();
                for (LearningAnalyticsDTO.BehaviorFlag flag : analytics.getFlags()) {
                        if ("HIGH".equals(flag.getSeverity())) {
                                alerts.add("CẢNH BÁO: " + flag.getMessage());
                        }
                }
                if (basicStats.getAverageScore() < 5.0)
                        alerts.add("Điểm trung bình đang dưới mức đạt.");
                summary.setRecentAlerts(alerts.stream().limit(5).collect(Collectors.toList()));

                // 4. Weaknesses (Re-use basic stats logic if available, or simplify)
                // For now, simplify as we don't store aggregate topic stats easily without
                // heavy calc
                // We will take weakness from the LATEST Exam if possible?
                // Or better, extract from basic stats subject performance if it was topics.
                // Here we imply using a placeholder or simple logic.
                summary.setTopWeaknesses(new ArrayList<>());

                summary.setOverallEffortScore(8.5); // Mock/Placeholder until complex Algo

                return summary;
        }

        private int extractDurationFromDetails(String jsonDetails) {
                if (jsonDetails == null || jsonDetails.isEmpty())
                        return 0;
                try {
                        // Quick hack parsing or use JsonService.
                        // Since this services uses tierManagerService which has jsonService embedded...
                        // But simpler: just look for "duration_seconds" string if not using full parse
                        // object to save memory?
                        // No, correct way is parsing.
                        // Assuming we can use ObjectMapper injected in TierManagerService?
                        // Or just manual parse for efficiency if structured strictly.
                        // Let's use simple regex/string search for robustness if full map parse is
                        // heavy
                        // OR better: use the TierManagerService helper if public? No it's private.
                        // Re-parsing is safer.

                        // Note: In real app, inject JsonService directly.
                        // For now, manual parse is defined here or add JsonService to constructor.
                        // Let's add extractDuration helper properly using TierManagerService's helper
                        // logic copy.
                        if (jsonDetails.contains("\"duration_seconds\":")) {
                                String sub = jsonDetails.split("\"duration_seconds\":")[1];
                                String num = sub.split("[,}]")[0].trim();
                                return Integer.parseInt(num);
                        }
                } catch (Exception e) {
                        // ignore
                }
                return 0;
        }

        @Override
        public com.igcse.ai.dto.thongKe.ExamStatisticsDTO getExamStatistics(Long examId, Long classId) {
                // Query DB
                Long gradedCount;
                Double averageScore;
                List<AIResult> results;

                if (classId == null) {
                        // Class-agnostic queries
                        gradedCount = aiResultRepository.countByExamId(examId);
                        averageScore = aiResultRepository.getAverageScoreByExamId(examId);
                        results = aiResultRepository.findByExamId(examId);
                } else {
                        // Class-specific queries
                        gradedCount = aiResultRepository.countByExamIdAndClassId(examId, classId);
                        averageScore = aiResultRepository.getAverageScoreByExamIdAndClassId(examId, classId);
                        results = aiResultRepository.findByExamIdAndClassId(examId, classId);
                }

                com.igcse.ai.dto.thongKe.ExamStatisticsDTO stats = new com.igcse.ai.dto.thongKe.ExamStatisticsDTO();
                stats.setExamId(examId);
                stats.setClassId(classId);
                stats.setGradedCount(gradedCount != null ? gradedCount.intValue() : 0);
                stats.setSubmittedCount(gradedCount != null ? gradedCount.intValue() : 0); // Assuming 1 result per
                                                                                           // student
                stats.setAverageScore(averageScore != null ? Math.round(averageScore * 10.0) / 10.0 : 0.0);

                // Calculate metadata (Top/Risk + Distribution)
                // 1. Distribution
                Map<String, Integer> dist = new HashMap<>();
                dist.put("Xuất sắc (8.5+)", 0); // >= 8.5
                dist.put("Tốt (7.0 - 8.4)", 0); // 7.0 - 8.4
                dist.put("Trung bình (5.0 - 6.9)", 0); // 5.0 - 6.9
                dist.put("Yếu (< 5.0)", 0); // < 5.0

                // 2. Lists
                // Map AIResult to StudentPerformanceSummaryDTO (simplified)
                List<com.igcse.ai.dto.thongKe.StudentPerformanceSummaryDTO> students = results.stream()
                                .map(r -> {
                                        com.igcse.ai.dto.thongKe.StudentPerformanceSummaryDTO s = new com.igcse.ai.dto.thongKe.StudentPerformanceSummaryDTO();
                                        s.setStudentId(r.getStudentId());
                                        s.setStudentName(r.getStudentName() != null ? r.getStudentName()
                                                        : "Student " + r.getStudentId());
                                        s.setAverageScore(r.getScore());
                                        s.setTotalExams(1);
                                        // Trend logic: N/A for single exam unless comparing history
                                        s.setTrend("STABLE");
                                        return s;
                                })
                                .collect(Collectors.toList());

                for (AIResult r : results) {
                        if (r.getScore() == null)
                                continue;
                        double s = r.getScore();
                        if (s >= 8.5)
                                dist.put("Xuất sắc (8.5+)", dist.get("Xuất sắc (8.5+)") + 1);
                        else if (s >= 7.0)
                                dist.put("Tốt (7.0 - 8.4)", dist.get("Tốt (7.0 - 8.4)") + 1);
                        else if (s >= 5.0)
                                dist.put("Trung bình (5.0 - 6.9)", dist.get("Trung bình (5.0 - 6.9)") + 1);
                        else
                                dist.put("Yếu (< 5.0)", dist.get("Yếu (< 5.0)") + 1);
                }
                stats.setScoreDistribution(dist);

                // Top Students
                stats.setTopStudents(students.stream()
                                .sorted((a, b) -> Double.compare(b.getAverageScore(), a.getAverageScore()))
                                .limit(5)
                                .collect(Collectors.toList()));

                // At Risk (Score < 5.0)
                stats.setAtRiskStudents(students.stream()
                                .filter(s -> s.getAverageScore() < 5.0)
                                .sorted((a, b) -> Double.compare(a.getAverageScore(), b.getAverageScore())) // Lowest
                                                                                                            // first
                                .limit(5)
                                .collect(Collectors.toList()));

                return stats;
        }

        @Override
        public List<Long> getParticipatedExamIds(Long classId) {
                return aiResultRepository.findExamIdsByClassId(classId);
        }
}
