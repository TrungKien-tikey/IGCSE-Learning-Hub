package com.igcse.course.controller;

import com.igcse.course.entity.Course;
import com.igcse.course.entity.Lesson;
import com.igcse.course.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    @Autowired private CourseService courseService;

    // --- COURSE APIs (Task 1 - CRUD Cơ bản) ---

    // 1. Chỉ lấy danh sách tất cả (Bỏ tham số keyword)
    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        Course course = courseService.getCourseById(id);
        return course != null ? ResponseEntity.ok(course) : ResponseEntity.status(404).body("Không tìm thấy khóa học");
    }

    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        try {
            return ResponseEntity.ok(courseService.createCourse(course));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody Course req) {
        try {
            return ResponseEntity.ok(courseService.updateCourse(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateCourse(@PathVariable Long id) {
        return courseService.deactivateCourse(id) ? ResponseEntity.ok("Đã ẩn khóa học") : ResponseEntity.status(404).body("Lỗi");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        return courseService.deleteCourse(id) ? ResponseEntity.ok("Đã xóa vĩnh viễn") : ResponseEntity.status(404).body("Lỗi");
    }

    // --- LESSON APIs (Task 2 - Chờ làm) ---

    @GetMapping("/{courseId}/lessons")
    public List<Lesson> getLessons(@PathVariable Long courseId) {
        return courseService.getLessonsByCourse(courseId);
    }

    @PostMapping("/{courseId}/lessons")
    public boolean addLesson(@PathVariable Long courseId, @RequestBody Lesson lesson) {
        return courseService.addLesson(courseId, lesson);
    }

    @GetMapping("/lessons/{lessonId}")
    public Lesson getLessonDetail(@PathVariable Long lessonId) {
        return courseService.getLessonById(lessonId);
    }

    @PutMapping("/lessons/{lessonId}")
    public Lesson updateLesson(@PathVariable Long lessonId, @RequestBody Lesson req) {
        return courseService.updateLesson(lessonId, req.getTitle(), req.getContent(), req.getOrderIndex());
    }

    @DeleteMapping("/lessons/{lessonId}")
    public boolean deleteLesson(@PathVariable Long lessonId) {
        return courseService.removeLesson(lessonId);
    }

    // --- ENROLLMENT & SEARCH APIs (Task 3 - Chờ làm) ---

    // API Tìm kiếm riêng biệt
    @GetMapping("/search")
    public ResponseEntity<List<Course>> searchCourses(@RequestParam String keyword) {
        return ResponseEntity.ok(courseService.searchCourses(keyword));
    }

    @PostMapping("/{courseId}/enroll")
    public boolean enroll(@PathVariable Long courseId, @RequestParam Long userId) {
        return courseService.enrollCourse(courseId, userId);
    }
}