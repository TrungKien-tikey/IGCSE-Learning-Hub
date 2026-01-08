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

    @Autowired
    private CourseService courseService;

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
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course courseDetails) {
        // Gọi thẳng service và trả về luôn
        return ResponseEntity.ok(courseService.updateCourse(id, courseDetails));
    }

    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateCourse(@PathVariable Long id) {
        return courseService.deactivateCourse(id) ? ResponseEntity.ok("Đã ẩn khóa học")
                : ResponseEntity.status(404).body("Lỗi");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        // GỌI SERVICE ĐỂ XÓA
        boolean deleted = courseService.deleteCourse(id);
        
        if (deleted) {
            return ResponseEntity.noContent().build(); // 204 No Content (Xóa thành công)
        } else {
            return ResponseEntity.notFound().build();  // 404 Not Found (Không tìm thấy ID)
        }
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

    // Sửa API PUT Lesson
    @PutMapping("/lessons/{lessonId}")
    public Lesson updateLesson(@PathVariable Long lessonId, @RequestBody Lesson req) {
        // Truyền thêm videoUrl và resourceUrl vào Service
        return courseService.updateLesson(
                lessonId,
                req.getTitle(),
                req.getContent(),
                req.getOrderIndex(),
                req.getVideoUrl(),
                req.getResourceUrl());
    }

    @DeleteMapping("/lessons/{lessonId}")
    public boolean deleteLesson(@PathVariable Long lessonId) {
        return courseService.removeLesson(lessonId);
    }

    // --- ENROLLMENT & SEARCH APIs (Task 3 - Chờ làm) ---

    // API Tìm kiếm riêng biệt
    // 1. API Tìm kiếm: GET /api/courses/search?keyword=Java
    @GetMapping("/search")
    public ResponseEntity<List<Course>> searchCourses(@RequestParam String keyword) {
        return ResponseEntity.ok(courseService.searchCourses(keyword));
    }

    // 2. API Ghi danh: POST /api/courses/{courseId}/enroll?userId=1
    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<?> enroll(@PathVariable Long courseId, @RequestParam Long userId) {
        boolean success = courseService.enrollCourse(courseId, userId);
        if (success) {
            return ResponseEntity.ok("Ghi danh thành công!");
        } else {
            return ResponseEntity.badRequest().body("Ghi danh thất bại (Khóa học không tồn tại hoặc đã đăng ký rồi)");
        }
    }
}