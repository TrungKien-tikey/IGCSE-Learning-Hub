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

@RestController
@RequestMapping("/api/v1/courses")
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
    // Sửa hàm này trong CourseController.java để tìm lỗi
    private Long getUserIdFromHeader(String tokenHeader) {
        System.out.println(">>> Header nhận được: " + tokenHeader); // Thêm dòng này
        if (tokenHeader != null && tokenHeader.startsWith("Bearer ")) {
            String token = tokenHeader.substring(7);
            if (jwtUtils.validateToken(token)) {
                Long id = jwtUtils.extractUserId(token);
                System.out.println(">>> UserId trích xuất được: " + id); // Thêm dòng này
                return id;
            } else {
                System.out.println(">>> Token không hợp lệ (Sai key hoặc hết hạn)");
            }
        }
        return null;
    }

    // --- COURSE APIs (Task 1 - CRUD Cơ bản) ---

    // 1. Chỉ lấy danh sách tất cả (Bỏ tham số keyword)
    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/test-connection")
    public ResponseEntity<String> testConnection() {
        return ResponseEntity.ok("Course Service is reachable at /api/v1/courses/test-connection");
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

    // 1b. API lấy danh sách khóa học DO TÔI DẠY (Dành cho Giáo viên)
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

    // 1. API lấy danh sách khóa học CỦA TÔI (Đã đăng ký)
    @GetMapping("/mine")
    public ResponseEntity<?> getMyCourses(@RequestHeader("Authorization") String tokenHeader) {
        Long userId = getUserIdFromHeader(tokenHeader);

        // Nếu token lỗi hoặc hết hạn -> Trả về 401 Unauthorized
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized: Vui lòng đăng nhập lại.");
        }

        List<Course> courses = courseService.getCoursesByStudentId(userId);
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

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        Course course = courseService.getCourseById(id);
        return course != null ? ResponseEntity.ok(course) : ResponseEntity.status(404).body("Không tìm thấy khóa học");
    }

    @PostMapping
    public ResponseEntity<?> createCourse(
            @RequestBody Course course,
            @RequestHeader("Authorization") String tokenHeader) {
        try {
            Long userId = getUserIdFromHeader(tokenHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body("Bạn chưa đăng nhập!");
            }

            // Check Token Logic
            String token = tokenHeader.substring(7);
            String role = jwtUtils.extractRole(token);
            String verificationStatus = jwtUtils.extractVerificationStatus(token);

            // 1. Phải là Teacher
            if (!"TEACHER".equals(role)) {
                return ResponseEntity.status(403).body("Chỉ giáo viên mới được tạo khóa học!");
            }

            // 2. Phải là APPROVED
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
    public ResponseEntity<?> deleteCourse(@PathVariable Long id, @RequestHeader("Authorization") String tokenHeader) {
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
            return ResponseEntity.status(500).body("Lỗi khi xóa");
        }
    }

    // API để Hiện khóa học lại (Chỉ MANAGER hoặc ADMIN được phép)
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

    // API Bước 4: Duyệt khóa học (Chỉ dành cho MANAGER/ADMIN)
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveCourse(@PathVariable Long id, @RequestHeader("Authorization") String tokenHeader) {
        String role = jwtUtils.extractRole(tokenHeader.substring(7));
        if (!"MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Bạn không có quyền thực hiện hành động này");
        }

        boolean success = courseService.approveCourse(id);
        return success ? ResponseEntity.ok("Duyệt thành công!") : ResponseEntity.notFound().build();
    }

    // API lấy danh sách cho trang chủ (Ai cũng xem được -> Chỉ hiện khóa đã duyệt)
    @GetMapping("/published")
    public ResponseEntity<List<Course>> getPublishedCourses() {
        return ResponseEntity.ok(courseService.getPublishedCourses());
    }

    // API lấy danh sách quản lý (Chỉ Admin/Manager xem được -> Hiện tất cả)
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllCoursesForAdmin(
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        // 1. Kiểm tra nếu không có Token
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Thiếu Token xác thực");
        }

        try {
            String token = tokenHeader.substring(7);
            String role = jwtUtils.extractRole(token);

            // 2. Kiểm tra quyền
            if (!"MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body("Bạn không có quyền MANAGER/ADMIN");
            }

            return ResponseEntity.ok(courseService.getAllCoursesForAdmin());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    // Học sinh đánh dấu hoàn thành bài học
    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    public ResponseEntity<?> markLessonAsComplete(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestHeader("Authorization") String token) {

        Long userId = getUserIdFromHeader(token);
        courseService.markLessonAsComplete(userId, courseId, lessonId); // Hàm service phải tồn tại
        return ResponseEntity.ok("Đã đánh dấu hoàn thành bài học");
    }

    // Lấy tiến độ của bản thân (Học sinh)
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

        // Bước này chỉ để kiểm tra xem bạn có đăng nhập hay chưa
        Long requesterId = getUserIdFromHeader(tokenHeader);
        if (requesterId == null)
            return ResponseEntity.status(401).body("Unauthorized");

        double progress = courseService.getCourseProgress(studentId, courseId);

        return ResponseEntity.ok(progress);
    }

    @GetMapping("/{courseId}/lessons/completed-ids")
    public ResponseEntity<List<Long>> getCompletedLessonIds(
            @PathVariable Long courseId,
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromHeader(token); // Lấy ID từ Token
        List<Long> completedIds = courseService.getCompletedLessonIds(userId, courseId);
        return ResponseEntity.ok(completedIds);
    }

}
