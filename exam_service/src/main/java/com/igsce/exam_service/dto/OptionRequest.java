package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.*;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class OptionRequest {
    private String content;
    @JsonProperty("isCorrect")
    private boolean isCorrect; 
}
