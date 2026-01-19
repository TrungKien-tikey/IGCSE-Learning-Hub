package com.igcse.ai.service.ass.thongKe;

import com.igcse.ai.dto.thongKe.ClassStatisticsDTO;
import com.igcse.ai.dto.thongKe.StudentStatisticsDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;

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

        public StatisticsService(AIResultRepository aiResultRepository) {
                this.aiResultRepository = aiResultRepository;
        }

        @Override
        public StudentStatisticsDTO getStudentStatistics(Long studentId) {
                logger.info("Getting statistics for studentId: {}", studentId);
                Objects.requireNonNull(studentId, "Student ID cannot be null");

                List<AIResult> results = aiResultRepository.findByStudentId(studentId);

                StudentStatisticsDTO stats = new StudentStatisticsDTO();
                stats.setStudentId(studentId);

                if (results.isEmpty()) {
                        logger.debug("No results found for studentId: {}", studentId);
                        stats.setTotalExams(0);
                        stats.setAverageScore(0.0);
                        stats.setHighestScore(0.0);
                        stats.setLowestScore(0.0);
                        stats.setImprovementRate(0.0);
                        stats.setSubjectPerformance(new HashMap<>());
                        return stats;
                }

                // Tính toán các thống kê cơ bản
                stats.setTotalExams(results.size());

                double averageScore = results.stream()
                                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                                .average()
                                .orElse(0.0);
                stats.setAverageScore(Math.round(averageScore * 100.0) / 100.0);

                OptionalDouble maxScore = results.stream()
                                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                                .max();
                stats.setHighestScore(maxScore.isPresent() ? maxScore.getAsDouble() : 0.0);

                OptionalDouble minScore = results.stream()
                                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                                .min();
                stats.setLowestScore(minScore.isPresent() ? minScore.getAsDouble() : 0.0);

                // Tính improvement rate (so sánh 2 tháng gần nhất)
                Date oneMonthAgo = Date.from(Instant.now().minus(30, ChronoUnit.DAYS));
                Date twoMonthsAgo = Date.from(Instant.now().minus(60, ChronoUnit.DAYS));

                List<AIResult> recentResults = aiResultRepository.findByStudentIdAndGradedAtAfter(studentId,
                                oneMonthAgo);
                List<AIResult> previousResults = aiResultRepository.findByStudentIdAndGradedAtAfter(studentId,
                                twoMonthsAgo);
                previousResults.removeAll(recentResults); // Chỉ lấy tháng thứ 2

                double improvementRate = 0.0;
                if (!recentResults.isEmpty() && !previousResults.isEmpty()) {
                        double recentAvg = recentResults.stream()
                                        .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                                        .average()
                                        .orElse(0.0);
                        double previousAvg = previousResults.stream()
                                        .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                                        .average()
                                        .orElse(0.0);

                        if (previousAvg > 0) {
                                improvementRate = ((recentAvg - previousAvg) / previousAvg) * 100.0;
                        }
                }
                stats.setImprovementRate(Math.round(improvementRate * 100.0) / 100.0);

                // Tính subject performance (group theo examId - giả định mỗi examId là một môn)
                Map<String, Double> subjectPerformance = results.stream()
                                .filter(r -> r.getExamId() != null)
                                .collect(Collectors.groupingBy(
                                                r -> "Exam " + r.getExamId(),
                                                Collectors.averagingDouble(
                                                                r -> r.getScore() != null ? r.getScore() : 0.0)));
                stats.setSubjectPerformance(subjectPerformance);

                logger.debug("Statistics calculated for studentId: {}, totalExams: {}, averageScore: {}",
                                studentId, stats.getTotalExams(), stats.getAverageScore());

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
