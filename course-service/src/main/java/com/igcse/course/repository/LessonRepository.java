package com.igcse.course.repository;

import com.igcse.course.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    // Lấy danh sách bài học của 1 khóa học, sắp xếp theo thứ tự
    List<Lesson> findByCourseCourseIdOrderByOrderIndexAsc(Long courseId);
    long countByCourseCourseId(Long courseId);
}