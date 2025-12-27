package com.igcse.ai.client;

import com.igcse.ai.entity.ExamAttempt;
import org.springframework.stereotype.Component;

/**
 * Client để lấy dữ liệu bài làm từ Exam Service
 * Hiện tại đang giả lập, sau này sẽ thay bằng Feign Client hoặc RestTemplate
 */
@Component
public class ExamAttemptClient {

    /**
     * Lấy ExamAttempt từ Exam Service
     * TODO: Thay thế bằng API call hoặc message queue
     */
    public ExamAttempt getExamAttempt(Long attemptId) {
        // Giả lập - sẽ được thay thế bằng HTTP client call
        ExamAttempt attempt = new ExamAttempt();
        attempt.setAttemptId(attemptId);
        attempt.setExamId(1L);
        attempt.setStudentId(1L);

        // TEST DATA: Bài thi có 2 câu trắc nghiệm + 1 câu tự luận
        String testAnswers = """
                {
                  "answers": [
                    {
                      "type": "MULTIPLE_CHOICE",
                      "questionId": 1,
                      "selectedOption": "A",
                      "correctOption": "A"
                    },
                    {
                      "type": "MULTIPLE_CHOICE",
                      "questionId": 2,
                      "selectedOption": "B",
                      "correctOption": "C"
                    },
                    {
                      "type": "ESSAY",
                      "questionId": 3,
                      "studentAnswer": "Photosynthesis is the process by which plants convert light energy into chemical energy. Plants use chlorophyll to absorb sunlight, carbon dioxide from the air, and water from the soil to produce glucose and oxygen. This occurs in the chloroplasts through light-dependent and light-independent reactions.",
                      "questionText": "Explain the process of photosynthesis in plants.",
                      "referenceAnswer": "Photosynthesis is the process where plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. It occurs in chloroplasts using chlorophyll. The light-dependent reactions occur in the thylakoid membranes, while the Calvin cycle occurs in the stroma.",
                      "maxScore": 10.0
                    }
                  ]
                }
                """;

        attempt.setAnswers(testAnswers);
        return attempt;
    }

    /**
     * Lấy tổng số câu hỏi
     */
    public int getTotalQuestions(Long examId) {
        // Giả lập
        return 10;
    }

    /**
     * Lấy danh sách bài làm của học sinh
     */
    public java.util.List<ExamAttempt> getAttemptsByStudent(Long studentId) {
        // Giả lập danh sách bài làm
        java.util.List<ExamAttempt> attempts = new java.util.ArrayList<>();
        // In real app, call Exam Service
        return attempts;
    }

    /**
     * Lấy danh sách bài làm của lớp học
     */
    public java.util.List<ExamAttempt> getAttemptsByClass(Long classId) {
        // Giả lập danh sách bài làm
        java.util.List<ExamAttempt> attempts = new java.util.ArrayList<>();
        // In real app, call Exam Service
        return attempts;
    }
}
