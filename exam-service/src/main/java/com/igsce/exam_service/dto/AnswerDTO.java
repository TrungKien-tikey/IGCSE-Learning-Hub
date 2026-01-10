package com.igsce.exam_service.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;

/**
 * Base DTO cho câu trả lời
 * Copy từ AI Service để đảm bảo tính độc lập (Decoupling)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = EssayAnswer.class, name = "ESSAY")
})
@Getter
@Setter
public class AnswerDTO {
    protected Long questionId;
    protected String type;
}
