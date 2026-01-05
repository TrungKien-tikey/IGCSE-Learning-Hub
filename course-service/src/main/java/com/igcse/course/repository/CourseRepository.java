package com.igcse.course.repository;

import com.igcse.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    // Tìm kiếm khóa học theo tên (chứa từ khóa, không phân biệt hoa thường)
    List<Course> findByTitleContainingIgnoreCase(String keyword);
}