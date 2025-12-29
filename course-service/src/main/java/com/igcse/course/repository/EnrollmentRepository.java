package com.igcse.course.repository;

import com.igcse.course.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    // Kiểm tra xem user này đã đăng ký khóa này chưa
    boolean existsByCourseCourseIdAndUserId(Long courseId, Long userId);
}