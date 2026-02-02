package com.igcse.course.service;

import com.igcse.course.entity.Course;
import com.igcse.course.entity.Enrollment;
import com.igcse.course.entity.Lesson;
import com.igcse.course.entity.LessonProgress;
import com.igcse.course.repository.CourseRepository;
import com.igcse.course.repository.EnrollmentRepository;
import com.igcse.course.repository.LessonProgressRepository;
import com.igcse.course.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private LessonProgressRepository lessonProgressRepository;
    @Autowired
    private com.igcse.course.client.PaymentClient paymentClient;

    // ==========================================
    // PHẦN 1: COURSE MANAGEMENT (Task 1 - Đã nâng cấp Validate)
    // ==========================================

    // Bỏ chữ "String keyword" trong ngoặc đi
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course != null) {
            course.setViewCount((course.getViewCount() != null ? course.getViewCount() : 0) + 1);
            courseRepository.save(course);
        }
        return course;
    }

    public Course createCourse(Course course, Long teacherId) {
        // Validate dữ liệu đầu vào
        if (course.getTitle() == null || course.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Tên khóa học không được để trống!");
        }
        if (course.getPrice() != null && course.getPrice() < 0) {
            throw new RuntimeException("Giá khóa học không được nhỏ hơn 0!");
        }

        course.setTeacherId(teacherId);
        course.setCreatedBy(teacherId);
        // Default to hidden until manager approves
        course.setActive(false);
        course.setStatus("PENDING");

        // Trừ 1 suất học của giáo viên
        boolean slotDeducted = paymentClient.useSlot(teacherId);
        if (!slotDeducted) {
            throw new RuntimeException("Bạn không còn suất học để tạo khóa học mới. Vui lòng mua thêm!");
        }

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
        existingCourse.updateCourse(req.getTitle(), req.getDescription(), req.getPrice(), req.getDuration());
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
        Course course = courseRepository.findById(id).orElse(null);
        if (course != null) {
            Long teacherId = course.getTeacherId();
            courseRepository.deleteById(id);
            // Hoàn trả 1 suất học cho giáo viên
            if (teacherId != null) {
                paymentClient.returnSlot(teacherId);
            }
            return true;
        }
        return false;
    }

    // Trong CourseService.java
    public boolean activateCourse(Long id) {
        Course course = getCourseById(id);
        if (course != null) {
            course.setActive(true); // Chuyển thành true (Hiện)
            courseRepository.save(course);
            return true;
        }
        return false;
    }

    public List<Course> getCoursesByStudentId(Long userId) {
        return courseRepository.findCoursesByStudentId(userId);
    }

    public List<Course> getCoursesByTeacherId(Long teacherId) {
        return courseRepository.findByTeacherId(teacherId);
    }

    public List<Course> getRecommendedCourses(Long userId) {
        return courseRepository.findRecommendedCourses(userId);
    }

    public boolean isStudentEnrolled(Long courseId, Long userId) {
        return enrollmentRepository.existsByCourseCourseIdAndUserId(courseId, userId);
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

    public Lesson updateLesson(Long lessonId, String title, String content, Integer order, String videoUrl,
            String resourceUrl) {
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

    // 1. Tìm kiếm khóa học
    public List<Course> searchCourses(String keyword) {
        if (keyword != null && !keyword.trim().isEmpty()) {
            return courseRepository.findByTitleContainingIgnoreCase(keyword.trim());
        }
        return courseRepository.findAll();
    }

    // 2. Ghi danh (Enroll)
    public boolean enrollCourse(Long courseId, Long userId) {
        // Kiểm tra 1: User đã đăng ký chưa?
        if (enrollmentRepository.existsByCourseCourseIdAndUserId(courseId, userId)) {
            return false; // Đã đăng ký rồi thì thôi
        }

        // Kiểm tra 2: Khóa học có tồn tại và đang mở không?
        Course course = getCourseById(courseId);
        if (course != null && course.isActive()) {
            Enrollment enrollment = new Enrollment();
            enrollment.setCourse(course);
            enrollment.setUserId(userId); // Lưu ID người dùng
            enrollmentRepository.save(enrollment);
            return true;
        }
        return false;
    }

    public boolean approveCourse(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course != null) {
            course.setActive(true); // Kích hoạt khóa học
            courseRepository.save(course); // Lưu xuống DB
            return true;
        }
        return false;
    }

    // 1. Hàm cho Admin/Manager (Lấy tất cả để xét duyệt)
    public List<Course> getAllCoursesForAdmin() {
        return courseRepository.findAll();
    }

    // 2. Hàm cho Học sinh/Giáo viên (Chỉ hiển thị khóa đã được duyệt)
    public List<Course> getPublishedCourses() {
        // Gọi findByIsActive thay vì findByActive
        return courseRepository.findByIsActive(true);
    }

    // 1. Đánh dấu hoàn thành bài học
    public void markLessonAsComplete(Long userId, Long courseId, Long lessonId) {

        // 1. Kiểm tra bài học có tồn tại không
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Bài học không tồn tại"));

        // 2. Kiểm tra bài học có thuộc khóa học đang gửi lên không (Bảo mật)
        if (!lesson.getCourse().getCourseId().equals(courseId)) {
            throw new RuntimeException("Bài học không thuộc khóa học này");
        }

        // 3. QUAN TRỌNG: Kiểm tra xem user đã mua khóa học chưa
        // Đổi tên hàm và đảo vị trí tham số cho khớp với Repository hiện tại
        boolean isEnrolled = enrollmentRepository.existsByCourseCourseIdAndUserId(courseId, userId);
        if (!isEnrolled) {
            throw new RuntimeException("Bạn chưa đăng ký khóa học này!");
        }

        // 4. Lưu tiến độ
        LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElse(new LessonProgress());

        // Nếu là record mới thì set thông tin
        if (progress.getId() == null) {
            progress.setUserId(userId);
            progress.setLessonId(lessonId);
            progress.setCourseId(courseId);
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        lessonProgressRepository.save(progress);
    }

    // 2. Tính % tiến độ khóa học
    public double getCourseProgress(Long userId, Long courseId) {
        // totalLessons: Đếm tổng bài của khóa 18
        long totalLessons = lessonRepository.countByCourseCourseId(courseId);
        if (totalLessons == 0)
            return 0.0;

        long completedLessons = lessonProgressRepository.countByUserIdAndCourseIdAndIsCompleted(userId, courseId, true);

        return (double) completedLessons / totalLessons * 100;
    }

    public List<Long> getCompletedLessonIds(Long userId, Long courseId) {
        // Gọi xuống Repository để lấy danh sách LessonProgress đã hoàn thành
        List<LessonProgress> progressList = lessonProgressRepository
                .findByUserIdAndCourseIdAndIsCompleted(userId, courseId, true);

        // Chuyển đổi từ danh sách Object sang danh sách ID (Long)
        return progressList.stream()
                .map(LessonProgress::getLessonId)
                .collect(Collectors.toList());
    }
}