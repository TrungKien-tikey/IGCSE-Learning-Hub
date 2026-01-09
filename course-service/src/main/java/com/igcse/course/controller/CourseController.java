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
            return ResponseEntity.notFound().build(); // 404 Not Found (Không tìm thấy ID)
        }
    }

    // --- LESSON APIs (Task 2 - Chờ làm) ---

    // 1. Lấy danh sách bài học của 1 khóa
    @GetMapping("/{courseId}/lessons")
    public ResponseEntity<List<Lesson>> getLessons(@PathVariable Long courseId) {
        List<Lesson> lessons = courseService.getLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }

    // 2. Thêm bài học mới
    @PostMapping("/{courseId}/lessons")
    public ResponseEntity<?> addLesson(@PathVariable Long courseId, @RequestBody Lesson lesson) {
        boolean success = courseService.addLesson(courseId, lesson);
        if (success) {
            return ResponseEntity.ok("Thêm bài học thành công!");
        } else {
            return ResponseEntity.badRequest().body("Lỗi: Không tìm thấy khóa học để thêm bài.");
        }
    }

    // 3. Xem chi tiết 1 bài học
    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<?> getLessonDetail(@PathVariable Long lessonId) {
        Lesson lesson = courseService.getLessonById(lessonId);
        return lesson != null ? ResponseEntity.ok(lesson) : ResponseEntity.notFound().build();
    }

    // 4. Sửa bài học
    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<?> updateLesson(@PathVariable Long lessonId, @RequestBody Lesson req) {
        Lesson updatedLesson = courseService.updateLesson(
                lessonId,
                req.getTitle(),
                req.getContent(),
                req.getOrderIndex(),
                req.getVideoUrl(),
                req.getResourceUrl());

        if (updatedLesson != null) {
            return ResponseEntity.ok(updatedLesson);
        } else {
            return ResponseEntity.badRequest().body("Lỗi: Không tìm thấy bài học ID " + lessonId);
        }
    }

    // 5. Xóa bài học
    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<?> deleteLesson(@PathVariable Long lessonId) {
        boolean deleted = courseService.removeLesson(lessonId);
        if (deleted) {
            return ResponseEntity.ok("Đã xóa bài học.");
        } else {
            return ResponseEntity.status(404).body("Không tìm thấy bài học để xóa.");
        }
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