package com.igsce.exam_service.repository;

import com.igsce.exam_service.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    // Tìm Answer theo attemptId và questionId
    // Lưu ý: Trong Spring Data JPA, không dùng underscore _ cho nested properties
    // Đúng: findByAttemptAttemptIdAndQuestionQuestionId
    // Sai: findByAttempt_AttemptIdAndQuestion_QuestionId
    Optional<Answer> findByAttemptAttemptIdAndQuestionQuestionId(Long attemptId, Long questionId);
    
    // Tìm tất cả Answer của một attempt
    List<Answer> findByAttemptAttemptId(Long attemptId);
}

