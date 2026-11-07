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
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
@Validated
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping("/health")
    public java.util.Map<String, String> health() {
        return java.util.Map.of("status", "UP");
    }

    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepositor;

    private Long getUserIdFromHeader(String tokenHeader) {
        System.out.println(">>> Header nhận được: " + tokenHeader);
        if (tokenHeader != null && tokenHeader.startsWith("Bearer ")) {
            String token = tokenHeader.substring(7);
            if (jwtUtils.validateToken(token)) {
                Long id = jwtUtils.extractUserId(token);
                System.out.println(">>> UserId trích xuất được: " + id);
                return id;
            } else {
                System.out.println(">>> Token không hợp lệ (Sai key hoặc hết hạn)");
            }
        }
        return null;
    }


    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/test-connection")
    public ResponseEntity<String> testConnection() {
        return ResponseEntity.ok("Course Service is reachable at /api/courses/test-connection");
    }

    @GetMapping("/debug/claim-all")
    public ResponseEntity<String> claimAllCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null)
            return ResponseEntity.status(401).body("Unauthorized");

        List<Course> all = courseRepository.findAll();
        for (Course c : all) {
            c.setTeacherId(userId);
            c.setCreatedBy(userId);
        }
        courseRepository.saveAll(all);
        return ResponseEntity.ok("Đã gán tất cả " + all.size() + " khóa học cho User ID: " + userId);
    }

    // Khóa học do giáo viên đang đăng nhập dạy
    @GetMapping("/teacher")
    public ResponseEntity<?> getTeacherCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        System.out.println(">>> FETCH TEACHER COURSES - Extracted UserId: " + userId);

        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: Vui lòng đăng nhập lại.");
        }

        List<Course> courses = courseService.getCoursesByTeacherId(userId);
        System.out.println(">>> FETCH TEACHER COURSES - Found: " + courses.size() + " courses");
        return ResponseEntity.ok(courses);
    }

    // Khóa học học sinh đang đăng nhập đã đăng ký
    @GetMapping("/mine")
    public ResponseEntity<?> getMyCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: Vui lòng đăng nhập lại.");
        }

        List<Course> courses = courseService.getCoursesByStudentId(userId);
        return ResponseEntity.ok(courses);
    }

    // Khóa học gợi ý: chưa đăng ký và đang mở
    @GetMapping("/recommended")
    public ResponseEntity<?> getRecommendedCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        List<Course> courses = courseService.getRecommendedCourses(userId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(
            @PathVariable @Min(value = 1, message = "ID phải lớn hơn hoặc bằng 1") @Max(value = 10000000, message = "ID quá lớn") Long id,
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {

        Long userId = getUserIdFromHeader(tokenHeader);
        String token = (tokenHeader != null && tokenHeader.startsWith("Bearer ")) ? tokenHeader.substring(7) : null;
        String role = (token != null) ? jwtUtils.extractRole(token) : null;

        Course course = courseService.getCourseById(id, userId, role);
        return ResponseEntity.ok(course);
    }

    @PostMapping
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody Course course,
            @RequestHeader("Authorization") String tokenHeader) {
        try {
            Long userId = getUserIdFromHeader(tokenHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body("Bạn chưa đăng nhập!");
            }

            String token = tokenHeader.substring(7);
            String role = jwtUtils.extractRole(token);
            String verificationStatus = jwtUtils.extractVerificationStatus(token);

            if (!"TEACHER".equals(role)) {
                return ResponseEntity.status(403).body("Chỉ giáo viên mới được tạo khóa học!");
            }

            if (!"APPROVED".equals(verificationStatus)) {
                return ResponseEntity.status(403)
                        .body("Tài khoản giáo viên chưa được duyệt (Status: " + verificationStatus + ")");
            }

            return ResponseEntity.ok(courseService.createCourse(course, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody Course courseDetails,
            @RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: vui lòng đăng nhập.");
        }
        Course existing = courseRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body("Không tìm thấy khóa học");
        }
        String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;
        String role = jwtUtils.extractRole(token);
        if (!userId.equals(existing.getTeacherId())
                && !(role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER")))) {
            return ResponseEntity.status(403).body("Không có quyền sửa khóa học này");
        }
        return ResponseEntity.ok(courseService.updateCourse(id, courseDetails));
    }

    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateCourse(@PathVariable Long id,
            @RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Course existing = courseRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body("Không tìm thấy khóa học");
        }
        String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;
        String role = jwtUtils.extractRole(token);
        if (!userId.equals(existing.getTeacherId())
                && !(role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER")))) {
            return ResponseEntity.status(403).body("Không có quyền ẩn khóa học này");
        }
        return courseService.deactivateCourse(id) ? ResponseEntity.ok("Đã ẩn khóa học")
                : ResponseEntity.status(404).body("Lỗi");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(
            @PathVariable Long id,
            @RequestHeader("Authorization") String tokenHeader) {

        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Course existing = courseRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;
        String role = jwtUtils.extractRole(token);

        if (!userId.equals(existing.getTeacherId())
                && !(role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER")))) {
            return ResponseEntity.status(403).body("Không có quyền xóa khóa học này");
        }

        boolean deleted = courseService.deleteCourse(id);

        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(404).body("Không tìm thấy khóa học để xóa");
        }
    }

    // Hiện khóa học (MANAGER/ADMIN)
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateCourse(@PathVariable Long id, @RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: vui lòng đăng nhập.");
        }
        String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;
        String role = jwtUtils.extractRole(token);
        if (role == null || !(role.equalsIgnoreCase("MANAGER") || role.equalsIgnoreCase("ADMIN"))) {
            return ResponseEntity.status(403).body("Không có quyền duyệt khóa học");
        }
        boolean activated = courseService.activateCourse(id);
        if (activated) {
            return ResponseEntity.ok("Đã hiện khóa học");
        } else {
            return ResponseEntity.status(404).body("Lỗi");
        }
    }

    // --- LESSON APIs ---

    @GetMapping("/{courseId}/lessons")
    public ResponseEntity<List<Lesson>> getLessons(@PathVariable Long courseId) {
        List<Lesson> lessons = courseService.getLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }

    @PostMapping("/{courseId}/lessons")
    public ResponseEntity<?> addLesson(
            @PathVariable Long courseId,
            @jakarta.validation.Valid @RequestBody Lesson lesson,
            @RequestHeader("Authorization") String tokenHeader) {

        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("Vui lòng đăng nhập để thực hiện thao tác này.");
        }

        String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;
        String role = jwtUtils.extractRole(token);

        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            return ResponseEntity.status(404).body("Không tìm thấy khóa học để thêm bài học.");
        }

        boolean isPrivileged = role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER"));
        boolean isOwner = userId.equals(course.getTeacherId());

        if (!isPrivileged && !isOwner) {
            return ResponseEntity.status(403).body("Bạn không có quyền quản lý nội dung của khóa học này.");
        }

        Lesson savedLesson = courseService.addLesson(courseId, lesson);
        return ResponseEntity.ok(savedLesson);
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<?> getLessonDetail(@PathVariable Long lessonId) {
        Lesson lesson = courseService.getLessonById(lessonId);
        return lesson != null ? ResponseEntity.ok(lesson) : ResponseEntity.notFound().build();
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<Lesson> updateLesson(@PathVariable Long lessonId,
            @jakarta.validation.Valid @RequestBody Lesson lessonDto) {
        Lesson updated = courseService.updateLesson(
                lessonId,
                lessonDto.getTitle(),
                lessonDto.getContent(),
                lessonDto.getOrderIndex(),
                lessonDto.getVideoUrl(),
                lessonDto.getResourceUrl(),
                lessonDto.getResourceName(),
                lessonDto.getMeetingUrl(),
                lessonDto.getStartTime());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<?> deleteLesson(@PathVariable Long lessonId,
                                          @RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("B\u1ea1n ch\u01b0a \u0111\u0103ng nh\u1eadp!");
        }

        Lesson existing = courseService.getLessonById(lessonId);
        if (existing == null) {
            return ResponseEntity.status(404).body("Kh\u00f4ng t\u00ecm th\u1ea5y b\u00e0i h\u1ecdc \u0111\u1ec3 x\u00f3a.");
        }

        String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;
        String role = jwtUtils.extractRole(token);
        boolean isPrivileged = role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER"));
        boolean isOwner = existing.getCourse() != null && userId.equals(existing.getCourse().getTeacherId());

        if (!isOwner && !isPrivileged) {
            return ResponseEntity.status(403).body("Kh\u00f4ng c\u00f3 quy\u1ec1n x\u00f3a b\u00e0i h\u1ecdc n\u00e0y");
        }

        boolean deleted = courseService.removeLesson(lessonId);
        if (deleted) {
            return ResponseEntity.ok("Đã xóa bài học.");
        } else {
            return ResponseEntity.status(404).body("Không tìm thấy bài học để xóa.");
        }
    }

    // --- ENROLLMENT & SEARCH APIs ---

    @GetMapping("/search")
    public ResponseEntity<List<Course>> searchCourses(@RequestParam String keyword) {
        return ResponseEntity.ok(courseService.searchCourses(keyword));
    }

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<?> enrollCourse(
            @PathVariable Long courseId,
            @RequestHeader("Authorization") String tokenHeader
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

        // Chưa đăng nhập coi như chưa đăng ký
        if (userId == null) {
            return ResponseEntity.ok(false);
        }

        boolean enrolled = courseService.isStudentEnrolled(courseId, userId);
        return ResponseEntity.ok(enrolled);
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<Long>> getCourseParticipants(@PathVariable Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Enrollment> enrollments = enrollmentRepositor.findByCourseCourseId(id);

        List<Long> participantIds = enrollments.stream()
                .map(Enrollment::getUserId)
                .collect(Collectors.toList());

        if (course.getCreatedBy() != null && !participantIds.contains(course.getCreatedBy())) {
            participantIds.add(course.getCreatedBy());
        }

        return ResponseEntity.ok(participantIds);
    }

    // --- INTERNAL APIs (For Microservices) ---
    @PostMapping("/internal/{courseId}/enroll")
    public ResponseEntity<?> internalEnroll(
            @PathVariable Long courseId,
            @RequestParam Long userId) {
        try {
            System.out.println("Processing internal enrollment: Course " + courseId + ", User " + userId);
            boolean success = courseService.enrollCourse(courseId, userId);
            if (success) {
                return ResponseEntity.ok("Internal enrollment successful");
            } else {
                return ResponseEntity.badRequest().body("Already enrolled or failed");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Duyệt khóa học (MANAGER/ADMIN)
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveCourse(@PathVariable Long id, @RequestHeader("Authorization") String tokenHeader) {
        String role = jwtUtils.extractRole(tokenHeader.substring(7));
        if (!"MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Bạn không có quyền thực hiện hành động này");
        }

        boolean success = courseService.approveCourse(id);
        return success ? ResponseEntity.ok("Duyệt thành công!") : ResponseEntity.notFound().build();
    }

    // Danh sách khóa học đã duyệt cho trang chủ
    @GetMapping("/published")
    public ResponseEntity<List<Course>> getPublishedCourses() {
        return ResponseEntity.ok(courseService.getPublishedCourses());
    }

    // Danh sách tất cả khóa học (MANAGER/ADMIN)
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllCoursesForAdmin(
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Thiếu Token xác thực");
        }

        try {
            String token = tokenHeader.substring(7);
            String role = jwtUtils.extractRole(token);

            if (!"MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body("Bạn không có quyền MANAGER/ADMIN");
            }

            return ResponseEntity.ok(courseService.getAllCoursesForAdmin());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    public ResponseEntity<?> markLessonAsComplete(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestHeader("Authorization") String token) {

        if (courseId < 1 || courseId > 10000000 || lessonId < 1 || lessonId > 10000000) {
            return ResponseEntity.status(404).body(java.util.Map.of(
                    "error", "Không tìm thấy khóa học hoặc bài học"));
        }

        Long userId = getUserIdFromHeader(token);

        courseService.markLessonAsComplete(userId, courseId, lessonId);
        return ResponseEntity.ok("Đã đánh dấu hoàn thành bài học");
    }

    @GetMapping("/{courseId}/progress")
    public ResponseEntity<?> getMyProgress(@PathVariable Long courseId, @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromHeader(token);
        return ResponseEntity.ok(courseService.getCourseProgress(userId, courseId));
    }

    @GetMapping("/{courseId}/progress/{studentId}")
    public ResponseEntity<?> getStudentProgress(
            @PathVariable Long courseId,
            @PathVariable Long studentId,
            @RequestHeader("Authorization") String tokenHeader) {

        Long requesterId = getUserIdFromHeader(tokenHeader);
        if (requesterId == null)
            return ResponseEntity.status(401).body("Unauthorized");

        if (courseId < 1 || courseId > 10000000 || studentId < 1 || studentId > 10000000) {
            return ResponseEntity.status(404).body("Không tìm thấy khóa học hoặc học sinh");
        }

        double progress = courseService.getCourseProgress(studentId, courseId);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/{courseId}/lessons/completed-ids")
    public ResponseEntity<List<Long>> getCompletedLessonIds(
            @PathVariable Long courseId,
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromHeader(token);
        List<Long> completedIds = courseService.getCompletedLessonIds(userId, courseId);
        return ResponseEntity.ok(completedIds);
    }

    @GetMapping("/student/{studentId}/summary")
    public ResponseEntity<?> getStudentProgressSummary(@PathVariable Long studentId) {
        return ResponseEntity.ok(courseService.getStudentProgressSummary(studentId));
    }


    // Tổng quan tiến độ của học sinh đang đăng nhập
    @GetMapping("/my-summary")
    public ResponseEntity<?> getMySummary(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(courseService.getStudentProgressSummary(userId));
    }
}
