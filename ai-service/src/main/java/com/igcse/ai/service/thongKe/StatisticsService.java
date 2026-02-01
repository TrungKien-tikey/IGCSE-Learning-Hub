package com.igcse.ai.service.thongKe;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;
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
                TierManagerService.AnalysisMetadata meta = tierManagerService.extractMetadata(studentId, null);

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
                TierManagerService.AnalysisMetadata meta = tierManagerService.extractMetadata(studentId, null);
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
}
