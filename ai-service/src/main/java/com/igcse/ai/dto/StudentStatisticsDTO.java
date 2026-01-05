package com.igcse.ai.dto;

import java.util.Map;

public class StudentStatisticsDTO {
    private Long studentId;
    private int totalExams;
    private double averageScore;
    private double highestScore;
    private double lowestScore;
    private Map<String, Double> subjectPerformance; // Môn học -> Điểm TB
    private double improvementRate; // Tỉ lệ cải thiện so với tháng trước

    // Getters and Setters
    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public int getTotalExams() {
        return totalExams;
    }

    public void setTotalExams(int totalExams) {
        this.totalExams = totalExams;
    }

    public double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(double averageScore) {
        this.averageScore = averageScore;
    }

    public double getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(double highestScore) {
        this.highestScore = highestScore;
    }

    public double getLowestScore() {
        return lowestScore;
    }

    public void setLowestScore(double lowestScore) {
        this.lowestScore = lowestScore;
    }

    public Map<String, Double> getSubjectPerformance() {
        return subjectPerformance;
    }

    public void setSubjectPerformance(Map<String, Double> subjectPerformance) {
        this.subjectPerformance = subjectPerformance;
    }

    public double getImprovementRate() {
        return improvementRate;
    }

    public void setImprovementRate(double improvementRate) {
        this.improvementRate = improvementRate;
    }
}
