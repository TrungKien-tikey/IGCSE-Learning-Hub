package com.igcse.course.repository;

import com.igcse.course.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);
    List<LessonProgress> findByUserIdAndCourseId(Long userId, Long courseId);
    long countByUserIdAndCourseIdAndIsCompleted(Long userId, Long courseId, boolean isCompleted);
    List<LessonProgress> findByUserIdAndCourseIdAndIsCompleted(Long userId, Long courseId, boolean isCompleted);
}