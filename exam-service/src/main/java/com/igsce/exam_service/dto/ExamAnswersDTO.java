package com.igsce.exam_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa tất cả câu trả lời của một bài thi
 * Được dùng để gửi qua RabbitMQ sang AI Service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAnswersDTO {
    @JsonProperty("attemptId")
    private Long attemptId;

    @JsonProperty("examId")
    private Long examId;

    @JsonProperty("studentId")
    private Long studentId;

    @JsonProperty("language")
    private String language; // "en" hoặc "vi"

    @JsonProperty("answers")
    private List<AnswerDTO> answers;
}
