package com.igsce.exam_service.repository;

import com.igsce.exam_service.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {
    List<ExamAttempt> findByUserId(Long userId);
    int countByExam_ExamIdAndUserId(Long examId, Long userId);
    List<ExamAttempt> findByExam_ExamIdOrderBySubmittedAtDesc(Long examId);
}
