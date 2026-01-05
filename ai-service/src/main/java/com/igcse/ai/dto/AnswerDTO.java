package com.igcse.ai.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Base DTO cho câu trả lời
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = MultipleChoiceAnswer.class, name = "MULTIPLE_CHOICE"),
        @JsonSubTypes.Type(value = EssayAnswer.class, name = "ESSAY")
})
public abstract class AnswerDTO {
    protected Long questionId;
    protected String type;

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
