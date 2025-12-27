package com.igcse.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Response DTO cho batch grading
 */
public class BatchGradingResponse {

    @JsonProperty("batchId")
    private String batchId;

    @JsonProperty("totalAttempts")
    private int totalAttempts;

    @JsonProperty("completedAttempts")
    private int completedAttempts;

    @JsonProperty("status")
    private String status; // "PENDING", "PROCESSING", "COMPLETED", "FAILED"

    @JsonProperty("startedAt")
    private Date startedAt;

    @JsonProperty("completedAt")
    private Date completedAt;

    @JsonProperty("language")
    private String language;

    @JsonProperty("results")
    private List<BatchItemResult> results;

    public BatchGradingResponse() {
        this.results = new ArrayList<>();
        this.status = "PENDING";
        this.startedAt = new Date();
    }

    public BatchGradingResponse(String batchId, int totalAttempts, String language) {
        this();
        this.batchId = batchId;
        this.totalAttempts = totalAttempts;
        this.language = language;
    }

    // ===== Getters and Setters =====
    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public int getTotalAttempts() {
        return totalAttempts;
    }

    public void setTotalAttempts(int totalAttempts) {
        this.totalAttempts = totalAttempts;
    }

    public int getCompletedAttempts() {
        return completedAttempts;
    }

    public void setCompletedAttempts(int completedAttempts) {
        this.completedAttempts = completedAttempts;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Date startedAt) {
        this.startedAt = startedAt;
    }

    public Date getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Date completedAt) {
        this.completedAt = completedAt;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public List<BatchItemResult> getResults() {
        return results;
    }

    public void setResults(List<BatchItemResult> results) {
        this.results = results;
    }

    public void addResult(BatchItemResult result) {
        this.results.add(result);
        this.completedAttempts = this.results.size();
    }

    /**
     * Kết quả chấm điểm cho một attempt trong batch
     */
    public static class BatchItemResult {
        @JsonProperty("attemptId")
        private Long attemptId;

        @JsonProperty("status")
        private String status; // "SUCCESS", "FAILED", "PENDING"

        @JsonProperty("score")
        private Double score;

        @JsonProperty("confidence")
        private Double confidence;

        @JsonProperty("passed")
        private Boolean passed;

        @JsonProperty("error")
        private String error;

        public BatchItemResult() {
            this.status = "PENDING";
        }

        public BatchItemResult(Long attemptId) {
            this();
            this.attemptId = attemptId;
        }

        // ===== Getters and Setters =====
        public Long getAttemptId() {
            return attemptId;
        }

        public void setAttemptId(Long attemptId) {
            this.attemptId = attemptId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

        public Double getConfidence() {
            return confidence;
        }

        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }

        public Boolean getPassed() {
            return passed;
        }

        public void setPassed(Boolean passed) {
            this.passed = passed;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        // Factory methods
        public static BatchItemResult success(Long attemptId, Double score, Double confidence, boolean passed) {
            BatchItemResult result = new BatchItemResult(attemptId);
            result.setStatus("SUCCESS");
            result.setScore(score);
            result.setConfidence(confidence);
            result.setPassed(passed);
            return result;
        }

        public static BatchItemResult failed(Long attemptId, String error) {
            BatchItemResult result = new BatchItemResult(attemptId);
            result.setStatus("FAILED");
            result.setError(error);
            return result;
        }
    }
}
