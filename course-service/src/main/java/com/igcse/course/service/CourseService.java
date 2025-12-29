package com.igcse.course.service;

import com.igcse.course.entity.Course;
import com.igcse.course.entity.Enrollment;
import com.igcse.course.entity.Lesson;
import com.igcse.course.repository.CourseRepository;
import com.igcse.course.repository.EnrollmentRepository;
import com.igcse.course.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CourseService {

    @Autowired private CourseRepository courseRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    // ==========================================
    // PHẦN 1: COURSE MANAGEMENT (Task 1 - Đã nâng cấp Validate)
    // ==========================================

    // Bỏ chữ "String keyword" trong ngoặc đi
public List<Course> getAllCourses() {
    return courseRepository.findAll();
}

    public Course getCourseById(Long id) {
        return courseRepository.findById(id).orElse(null);
    }

    public Course createCourse(Course course) {
        // Validate dữ liệu đầu vào
        if (course.getTitle() == null || course.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Tên khóa học không được để trống!");
        }
        if (course.getPrice() != null && course.getPrice() < 0) {
            throw new RuntimeException("Giá khóa học không được nhỏ hơn 0!");
        }
        
        course.setActive(true);
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, Course req) {
        Course existingCourse = getCourseById(id);
        if (existingCourse == null) {
            throw new RuntimeException("Không tìm thấy khóa học ID: " + id);
        }

        // Validate khi update
        if (req.getPrice() != null && req.getPrice() < 0) {
            throw new RuntimeException("Giá tiền không hợp lệ!");
        }

        // Gọi hàm update của Entity
        existingCourse.updateCourse(req.getTitle(), req.getDescription(), req.getPrice());
        return courseRepository.save(existingCourse);
    }

    public boolean deactivateCourse(Long id) {
        Course course = getCourseById(id);
        if (course != null) {
            course.deactivate(); // Soft delete
            courseRepository.save(course);
            return true;
        }
        return false;
    }

    public boolean deleteCourse(Long id) {
        if (courseRepository.existsById(id)) {
            courseRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ==========================================
    // PHẦN 2: LESSON MANAGEMENT (Task 2 - Giữ nguyên chờ làm)
    // ==========================================

    public List<Lesson> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseCourseIdOrderByOrderIndexAsc(courseId);
    }

    public boolean addLesson(Long courseId, Lesson lesson) {
        Course course = getCourseById(courseId);
        if (course != null) {
            lesson.setCourse(course);
            lessonRepository.save(lesson);
            return true;
        }
        return false;
    }

    public Lesson getLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId).orElse(null);
    }

    public Lesson updateLesson(Long lessonId, String title, String content, Integer order, String videoUrl, String resourceUrl) {
        Lesson lesson = getLessonById(lessonId);
        if (lesson != null) {
            // Gọi hàm update mới bên Entity
            lesson.updateLesson(title, content, order, videoUrl, resourceUrl);
            return lessonRepository.save(lesson);
        }
        return null;
    }

    public boolean removeLesson(Long lessonId) {
        if (lessonRepository.existsById(lessonId)) {
            lessonRepository.deleteById(lessonId);
            return true;
        }
        return false;
    }

    // ==========================================
    // PHẦN 3: ENROLLMENT (Task 3 - Giữ nguyên chờ làm)
    // ==========================================
    
    public List<Course> searchCourses(String keyword) {
        if (keyword != null && !keyword.trim().isEmpty()) {
            return courseRepository.findByTitleContainingIgnoreCase(keyword.trim());
        }
        return courseRepository.findAll();
    }

    public boolean enrollCourse(Long courseId, Long userId) {
        if (enrollmentRepository.existsByCourseCourseIdAndUserId(courseId, userId)) {
            return false; // Đã đăng ký rồi
        }
        Course course = getCourseById(courseId);
        if (course != null && course.isActive()) {
            Enrollment enrollment = new Enrollment();
            enrollment.setCourse(course);
            enrollment.setUserId(userId);
            enrollmentRepository.save(enrollment);
            return true;
        }
        return false;
    }
}