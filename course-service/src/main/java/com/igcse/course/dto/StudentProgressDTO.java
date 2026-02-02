package com.igcse.course.dto;

import lombok.Data;

@Data
public class StudentProgressDTO {
    private Long courseId;
    private String courseTitle;
    // Đã bỏ courseImage
    private double progress;    // % hoàn thành
    private int completedLessons;
    private int totalLessons;
}