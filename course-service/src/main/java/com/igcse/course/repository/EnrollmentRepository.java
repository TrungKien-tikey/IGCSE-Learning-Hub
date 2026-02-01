package com.igcse.course.repository;

import com.igcse.course.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    // Kiểm tra xem user này đã đăng ký khóa này chưa
    boolean existsByCourseCourseIdAndUserId(Long courseId, Long userId);
    List<Enrollment> findByCourseCourseId(Long courseId);
}