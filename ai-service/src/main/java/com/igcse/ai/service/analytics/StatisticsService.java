package com.igcse.ai.service.analytics;

import com.igcse.ai.dto.ClassStatisticsDTO;
import com.igcse.ai.dto.StudentStatisticsDTO;
import com.igcse.ai.entity.AIResult;
import com.igcse.ai.repository.AIResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService implements IStatisticsService {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsService.class);

    private final AIResultRepository aiResultRepository;

    @Autowired
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

        List<AIResult> recentResults = aiResultRepository.findByStudentIdAndGradedAtAfter(studentId, oneMonthAgo);
        List<AIResult> previousResults = aiResultRepository.findByStudentIdAndGradedAtAfter(studentId, twoMonthsAgo);
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
                        Collectors.averagingDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                ));
        stats.setSubjectPerformance(subjectPerformance);

        logger.debug("Statistics calculated for studentId: {}, totalExams: {}, averageScore: {}", 
                studentId, stats.getTotalExams(), stats.getAverageScore());

        return stats;
    }

    @Override
    public ClassStatisticsDTO getClassStatistics(Long classId) {
        logger.info("Getting statistics for classId: {}", classId);
        Objects.requireNonNull(classId, "Class ID cannot be null");

        // Lấy tất cả examId của lớp (giả định cần gọi exam-service để lấy danh sách)
        // Hiện tại query tất cả results và group theo examId
        List<AIResult> allResults = aiResultRepository.findAll();

        ClassStatisticsDTO stats = new ClassStatisticsDTO();
        stats.setClassId(classId);
        stats.setClassName("Class " + classId);

        // Group theo examId để tính statistics cho từng exam
        Map<Long, List<AIResult>> resultsByExam = allResults.stream()
                .filter(r -> r.getExamId() != null)
                .collect(Collectors.groupingBy(AIResult::getExamId));

        if (resultsByExam.isEmpty()) {
            logger.debug("No results found for classId: {}", classId);
            stats.setTotalStudents(0);
            stats.setClassAverageScore(0.0);
            stats.setCompletedAssignments(0);
            stats.setPendingAssignments(0);
            return stats;
        }

        // Tính số học sinh unique
        Set<Long> uniqueStudents = allResults.stream()
                .filter(r -> r.getStudentId() != null)
                .map(AIResult::getStudentId)
                .collect(Collectors.toSet());
        stats.setTotalStudents(uniqueStudents.size());

        // Tính điểm trung bình của lớp
        double classAverage = allResults.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average()
                .orElse(0.0);
        stats.setClassAverageScore(Math.round(classAverage * 100.0) / 100.0);

        // Số bài đã hoàn thành = số results
        stats.setCompletedAssignments(allResults.size());

        // Pending assignments - không có dữ liệu, để 0 hoặc cần query từ exam-service
        stats.setPendingAssignments(0);

        logger.debug("Class statistics calculated for classId: {}, totalStudents: {}, averageScore: {}", 
                classId, stats.getTotalStudents(), stats.getClassAverageScore());

        return stats;
    }

    @Override
    public Map<String, Object> getSystemStatistics() {
        logger.info("Getting system statistics");

        Map<String, Object> stats = new HashMap<>();
        long totalGraded = aiResultRepository.count();
        stats.put("totalGraded", totalGraded);

        // Tính average accuracy dựa trên confidence score
        List<AIResult> allResults = aiResultRepository.findAll();
        if (!allResults.isEmpty()) {
            double avgConfidence = allResults.stream()
                    .filter(r -> r.getConfidence() != null)
                    .mapToDouble(AIResult::getConfidence)
                    .average()
                    .orElse(0.0);
            stats.put("averageAccuracy", Math.round(avgConfidence * 10000.0) / 100.0); // Convert to percentage
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
