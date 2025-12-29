package com.igsce.exam_service.repository;

import com.igsce.exam_service.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
