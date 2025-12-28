package com.igcse.course.controller;

import com.igcse.course.entity.Course;
import com.igcse.course.entity.Lesson;
import com.igcse.course.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*") // Cho phép Frontend gọi thoải mái
public class CourseController {

    @Autowired private CourseService courseService;

    // 1. Lấy danh sách & Tìm kiếm
    @GetMapping
    public List<Course> getCourses(@RequestParam(required = false) String keyword) {
        return courseService.searchCourses(keyword);
    }

    // 2. Chi tiết khóa học
    @GetMapping("/{id}")
    public Course getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id);
    }

    // 3. Tạo mới
    @PostMapping
    public Course createCourse(@RequestBody Course course) {
        return courseService.createCourse(course);
    }

    // 4. Cập nhật
    @PutMapping("/{id}")
    public Course updateCourse(@PathVariable Long id, @RequestBody Course req) {
        return courseService.updateCourse(id, req.getTitle(), req.getDescription(), req.getPrice());
    }

    // 5. Vô hiệu hóa
    @DeleteMapping("/{id}/deactivate")
    public boolean deactivateCourse(@PathVariable Long id) {
        return courseService.deactivateCourse(id);
    }

    // 6. Xóa vĩnh viễn
    @DeleteMapping("/{id}")
    public boolean deleteCourse(@PathVariable Long id) {
        return courseService.deleteCourse(id);
    }

    // 7. Ghi danh
    @PostMapping("/{courseId}/enroll")
    public boolean enroll(@PathVariable Long courseId, @RequestParam Long userId) {
        return courseService.enrollCourse(courseId, userId);
    }

    // --- Bài học (Lesson) APIs ---
    
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
}