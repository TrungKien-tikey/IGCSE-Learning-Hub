package com.igcse.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTO chứa tất cả câu trả lời của một bài thi
 */
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

    public ExamAnswersDTO() {
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public List<AnswerDTO> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerDTO> answers) {
        this.answers = answers;
    }
}
