package com.igcse.course.controller;

import com.igcse.course.entity.Course;
import com.igcse.course.entity.Enrollment;
import com.igcse.course.entity.Lesson;
import com.igcse.course.repository.CourseRepository;
import com.igcse.course.repository.EnrollmentRepository;
import com.igcse.course.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.igcse.course.util.JwtUtils;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    @Autowired
    private CourseService courseService;
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private CourseRepository courseRepository; 
    @Autowired
    private EnrollmentRepository enrollmentRepositor;

    // --- Helper method để lấy ID từ Header ---
    private Long getUserIdFromHeader(String tokenHeader) {
        if (tokenHeader != null && tokenHeader.startsWith("Bearer ")) {
            String token = tokenHeader.substring(7); // Cắt bỏ chữ "Bearer "
            if (jwtUtils.validateToken(token)) {
                return jwtUtils.extractUserId(token); // Giải mã lấy ID
            }
        }
        return null; // Token lỗi hoặc không có
    }

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

    // API để Hiện khóa học lại
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateCourse(@PathVariable Long id) {
        return courseService.activateCourse(id) ? ResponseEntity.ok("Đã hiện khóa học")
                : ResponseEntity.status(404).body("Lỗi");
    }

    // 1. API lấy danh sách khóa học CỦA TÔI (Đã đăng ký)
    @GetMapping("/my-courses")
    public ResponseEntity<?> getMyCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        // Nếu token lỗi hoặc hết hạn -> Trả về 401 Unauthorized
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: Vui lòng đăng nhập lại.");
        }

        List<Course> courses = courseService.getCoursesByStudentId(userId);
        return ResponseEntity.ok(courses);
    }

    // 1b. API lấy danh sách khóa học DO TÔI DẠY (Dành cho Giáo viên)
    @GetMapping("/teacher-courses")
    public ResponseEntity<?> getTeacherCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: Vui lòng đăng nhập lại.");
        }

        List<Course> courses = courseService.getCoursesByTeacherId(userId);
        return ResponseEntity.ok(courses);
    }

    // 2. API lấy danh sách GỢI Ý (Chưa đăng ký + Đang Active)
    @GetMapping("/recommended")
    public ResponseEntity<?> getRecommendedCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        List<Course> courses = courseService.getRecommendedCourses(userId);
        return ResponseEntity.ok(courses);
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

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<?> enrollCourse(
            @PathVariable Long courseId,
            @RequestHeader("Authorization") String tokenHeader // Đổi @RequestParam thành @RequestHeader
    ) {
        Long userId = getUserIdFromHeader(tokenHeader);

        if (userId == null) {
            return ResponseEntity.status(401).body("Bạn chưa đăng nhập!");
        }

        try {
            boolean success = courseService.enrollCourse(courseId, userId);
            if (success) {
                return ResponseEntity.ok("Đăng ký thành công!");
            } else {
                return ResponseEntity.badRequest().body("Bạn đã đăng ký khóa này rồi hoặc khóa học không tồn tại.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/{courseId}/check-enrollment")
    public ResponseEntity<Boolean> checkEnrollment(
            @PathVariable Long courseId,
            @RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        // Nếu chưa đăng nhập thì coi như chưa đăng ký -> trả về false
        if (userId == null) {
            return ResponseEntity.ok(false);
        }

        boolean enrolled = courseService.isStudentEnrolled(courseId, userId);
        return ResponseEntity.ok(enrolled);
    }
   @GetMapping("/{id}/participants")
    public ResponseEntity<List<Long>> getCourseParticipants(@PathVariable Long id) {
        // 1. Tìm khóa học để lấy ID giáo viên (createdBy)
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // 2. Lấy danh sách học viên từ bảng Enrollment
        List<Enrollment> enrollments = enrollmentRepositor.findByCourseCourseId(id);
        
        List<Long> participantIds = enrollments.stream()
                .map(Enrollment::getUserId)
                .collect(Collectors.toList());
                
        // 3. Thêm giáo viên vào danh sách (nếu chưa có)
        // Lưu ý: Đảm bảo createdBy không null trong DB
        if (course.getCreatedBy() != null && !participantIds.contains(course.getCreatedBy())) {
            participantIds.add(course.getCreatedBy());
        }
        
        return ResponseEntity.ok(participantIds);
    }
}