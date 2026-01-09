package com.igcse.ai.dto.aiChamDiem;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa tất cả câu trả lời của một bài thi
 */
@Data
@NoArgsConstructor
public class ExamAnswersDTO {
    @JsonProperty("attemptId")
    private Long attemptId;

    @JsonProperty("examId")
    private Long examId;

    @JsonProperty("studentId")
    private Long studentId;

    @JsonProperty("language")
    private String language; // "en" hoặc "vi", mặc định "en"

    @JsonProperty("answers")
    private List<AnswerDTO> answers;
}
