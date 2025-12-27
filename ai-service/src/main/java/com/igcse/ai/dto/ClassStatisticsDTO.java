package com.igcse.ai.dto;

import java.util.List;

public class ClassStatisticsDTO {
    private Long classId;
    private String className;
    private int totalStudents;
    private double classAverageScore;
    private int completedAssignments;
    private int pendingAssignments;
    private List<StudentStatisticsDTO> topStudents;
    private List<String> commonWeaknesses;

    // Getters and Setters
    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public int getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(int totalStudents) {
        this.totalStudents = totalStudents;
    }

    public double getClassAverageScore() {
        return classAverageScore;
    }

    public void setClassAverageScore(double classAverageScore) {
        this.classAverageScore = classAverageScore;
    }

    public int getCompletedAssignments() {
        return completedAssignments;
    }

    public void setCompletedAssignments(int completedAssignments) {
        this.completedAssignments = completedAssignments;
    }

    public int getPendingAssignments() {
        return pendingAssignments;
    }

    public void setPendingAssignments(int pendingAssignments) {
        this.pendingAssignments = pendingAssignments;
    }

    public List<StudentStatisticsDTO> getTopStudents() {
        return topStudents;
    }

    public void setTopStudents(List<StudentStatisticsDTO> topStudents) {
        this.topStudents = topStudents;
    }

    public List<String> getCommonWeaknesses() {
        return commonWeaknesses;
    }

    public void setCommonWeaknesses(List<String> commonWeaknesses) {
        this.commonWeaknesses = commonWeaknesses;
    }
}
