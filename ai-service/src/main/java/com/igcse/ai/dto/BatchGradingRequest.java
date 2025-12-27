package com.igcse.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Request DTO cho batch grading
 */
public class BatchGradingRequest {

    @JsonProperty("attemptIds")
    private List<Long> attemptIds;

    @JsonProperty("language")
    private String language; // "en" hoặc "vi", mặc định "en"

    public BatchGradingRequest() {
    }

    public BatchGradingRequest(List<Long> attemptIds, String language) {
        this.attemptIds = attemptIds;
        this.language = language;
    }

    public List<Long> getAttemptIds() {
        return attemptIds;
    }

    public void setAttemptIds(List<Long> attemptIds) {
        this.attemptIds = attemptIds;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
