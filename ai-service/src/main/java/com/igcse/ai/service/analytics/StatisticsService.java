package com.igcse.ai.service.analytics;

import com.igcse.ai.client.ExamAttemptClient;
import com.igcse.ai.dto.ClassStatisticsDTO;
import com.igcse.ai.dto.StudentStatisticsDTO;
import com.igcse.ai.repository.AIResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StatisticsService implements IStatisticsService {

    private final AIResultRepository aiResultRepository;
    private final ExamAttemptClient examAttemptClient;

    @Autowired
    public StatisticsService(AIResultRepository aiResultRepository, ExamAttemptClient examAttemptClient) {
        this.aiResultRepository = aiResultRepository;
        this.examAttemptClient = examAttemptClient;
    }

    @Override
    public StudentStatisticsDTO getStudentStatistics(Long studentId) {
        // TODO: Implement actual logic querying Repository
        // Mock data for now
        StudentStatisticsDTO stats = new StudentStatisticsDTO();
        stats.setStudentId(studentId);
        stats.setTotalExams(15);
        stats.setAverageScore(8.5);
        stats.setHighestScore(10.0);
        stats.setLowestScore(7.0);
        stats.setImprovementRate(5.0);

        Map<String, Double> subjects = new HashMap<>();
        subjects.put("Toán", 9.2);
        subjects.put("Vật lý", 7.8);
        stats.setSubjectPerformance(subjects);

        return stats;
    }

    @Override
    public ClassStatisticsDTO getClassStatistics(Long classId) {
        // Mock data
        ClassStatisticsDTO stats = new ClassStatisticsDTO();
        stats.setClassId(classId);
        stats.setClassName("10A1");
        stats.setTotalStudents(30);
        stats.setClassAverageScore(8.2);
        stats.setCompletedAssignments(150);
        stats.setPendingAssignments(23);

        return stats;
    }

    @Override
    public Map<String, Object> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGraded", aiResultRepository.count());
        stats.put("hoursSaved", 12.5); // Mock
        stats.put("averageAccuracy", 98.5); // Mock
        return stats;
    }
}
