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

    // --- 1. CRUD Course ---
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long courseId) {
        return courseRepository.findById(courseId).orElse(null);
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(Long courseId, String title, String desc, Double price) {
        Course course = getCourseById(courseId);
        if (course != null) {
            course.updateCourse(title, desc, price); // Gọi hàm của Entity
            return courseRepository.save(course);
        }
        return null;
    }

    public boolean deactivateCourse(Long courseId) {
        Course course = getCourseById(courseId);
        if (course != null) {
            course.deactivate(); // Soft delete
            courseRepository.save(course);
            return true;
        }
        return false;
    }

    public boolean deleteCourse(Long courseId) {
        if (courseRepository.existsById(courseId)) {
            courseRepository.deleteById(courseId); // Hard delete
            return true;
        }
        return false;
    }

    public List<Course> searchCourses(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllCourses();
        }
        return courseRepository.findByTitleContainingIgnoreCase(keyword);
    }

    // --- 2. Enrollment ---
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

    // --- 3. CRUD Lesson ---
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

    public Lesson updateLesson(Long lessonId, String title, String content, Integer order) {
        Lesson lesson = getLessonById(lessonId);
        if (lesson != null) {
            lesson.updateLesson(title, content, order);
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
    
    // Hàm phụ trợ để lấy list bài học cho Controller gọi nếu cần
    public List<Lesson> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseCourseIdOrderByOrderIndexAsc(courseId);
    }
}