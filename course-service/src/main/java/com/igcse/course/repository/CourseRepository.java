package com.igcse.course.repository;

import com.igcse.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    // Tìm kiếm khóa học theo tên (chứa từ khóa, không phân biệt hoa thường)
    List<Course> findByTitleContainingIgnoreCase(String keyword);

    // Tìm các khóa học do giáo viên giảng dạy (Kiểm tra cả teacherId và createdBy)
    @Query("SELECT c FROM Course c WHERE c.teacherId = :teacherId OR c.createdBy = :teacherId")
    List<Course> findByTeacherId(@Param("teacherId") Long teacherId);

    // 1. Tìm các khóa học mà User này ĐÃ đăng ký
    // (Dựa vào bảng Enrollment nối với Course)
    @Query("SELECT c FROM Course c JOIN c.enrollments e WHERE e.userId = :userId")
    List<Course> findCoursesByStudentId(@Param("userId") Long userId);

    // 2. Tìm các khóa học User CHƯA đăng ký (Gợi ý)
    // (Lấy tất cả khóa Active TRỪ ĐI các khóa đã có trong bảng Enrollment của user
    // đó)
    @Query("SELECT c FROM Course c WHERE c.isActive = true AND c.courseId NOT IN (SELECT e.course.courseId FROM Enrollment e WHERE e.userId = :userId)")
    List<Course> findRecommendedCourses(@Param("userId") Long userId);

    // Đổi tên hàm thành findByIsActive
    List<Course> findByIsActive(boolean isActive);

}