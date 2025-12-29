package com.igcse.ai.client;

import com.igcse.ai.entity.ExamAttempt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Client để lấy dữ liệu bài làm từ Exam Service
 * Hiện tại đang giả lập, sau này sẽ thay bằng Feign Client hoặc RestTemplate
 */
@Component
public class ExamAttemptClient {

    /**
     * Lấy ExamAttempt từ Exam Service
     * Dữ liệu mẫu đã được nâng cấp để đạt điểm tuyệt đối (10/10)
     */
    public ExamAttempt getExamAttempt(Long attemptId) {
        // Giả lập - sẽ được thay thế bằng HTTP client call thực tế
        ExamAttempt attempt = new ExamAttempt();
        attempt.setAttemptId(attemptId);
        attempt.setExamId(1L);
        attempt.setStudentId(1L);

        // DỮ LIỆU KIỂM THỬ: Câu trả lời Essay đã được tối ưu hóa với thuật ngữ chuyên sâu
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
                      "selectedOption": "C",
                      "correctOption": "C"
                    },
                    {
                      "type": "ESSAY",
                      "questionId": 3,
                      "studentAnswer": "Quang hợp là quá trình sinh hóa mà thực vật chuyển hóa năng lượng ánh sáng thành năng lượng hóa học dưới dạng glucose. Quá trình này diễn ra chủ yếu ở lục lạp của tế bào lá nhờ sắc tố diệp lục hấp thụ quang năng. Cơ chế quang hợp gồm hai giai đoạn chính: Pha sáng diễn ra tại màng thylakoid, nơi năng lượng ánh sáng được dùng để phân ly nước và tạo ra ATP, NADPH; sau đó là pha tối (chu trình Calvin) diễn ra tại chất nền stroma, sử dụng CO2 cùng với ATP và NADPH từ pha sáng để tổng hợp nên đường glucose và giải phóng oxy.",
                      "questionText": "Hãy giải thích quá trình quang hợp ở thực vật.",
                      "referenceAnswer": "Quang hợp là quá trình thực vật chuyển hóa năng lượng ánh sáng thành năng lượng hóa học. Thực vật sử dụng ánh sáng mặt trời, nước và CO2 để tổng hợp glucose và oxy. Quá trình diễn ra tại lục lạp nhờ sắc tố diệp lục. Các phản ứng sáng xảy ra ở màng thylakoid, trong khi chu trình Calvin (phản ứng tối) xảy ra ở chất nền stroma.",
                      "maxScore": 10.0
                    }
                  ]
                }
                """;

        attempt.setAnswers(testAnswers);
        return attempt;
    }

    /**
     * Lấy tổng số câu hỏi (Giả lập)
     */
    public int getTotalQuestions(Long examId) {
        return 10;
    }

    /**
     * Lấy danh sách bài làm của học sinh (Giả lập)
     */
    public List<ExamAttempt> getAttemptsByStudent(Long studentId) {
        return new ArrayList<>();
    }

    /**
     * Lấy danh sách bài làm của lớp học (Giả lập)
     */
    public List<ExamAttempt> getAttemptsByClass(Long classId) {
        return new ArrayList<>();
    }
}