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

    // --- Course management ---

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

    public Course getCourseById(Long id, Long userId, String role) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy khóa học ID: " + id));

        boolean isPrivileged = role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER"));
        boolean isOwner = userId != null && userId.equals(course.getTeacherId());
        boolean isEnrolled = enrollmentRepository.existsByCourseCourseIdAndUserId(id, userId);

        if (!isPrivileged && !isOwner && !isEnrolled) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Bạn không có quyền xem chi tiết khóa học này.");
        }

        return getCourseById(id);
    }

    public Course createCourse(Course course, Long teacherId) {
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

        if (req.getPrice() != null && req.getPrice() < 0) {
            throw new RuntimeException("Giá tiền không hợp lệ!");
        }

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
            if (enrollmentRepository.existsByCourseCourseId(id)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Không thể xóa khóa học do đã có học sinh đăng ký");
            }

            // Lưu teacherId trước khi xóa để hoàn suất học
            Long teacherId = course.getTeacherId();

            courseRepository.deleteById(id);

            // Hoàn trả suất học cho giáo viên
            if (teacherId != null) {
                paymentClient.returnSlot(teacherId);
            }
            return true;
        }
        return false;
    }

    public boolean activateCourse(Long id) {
        Course course = getCourseById(id);
        if (course != null) {
            course.setActive(true);
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

    // --- Lesson management ---

    public List<Lesson> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseCourseIdOrderByOrderIndexAsc(courseId);
    }

    public Lesson addLesson(Long courseId, Lesson lesson) {
        Course course = getCourseById(courseId);

        if (course == null) {
            throw new RuntimeException("Lỗi: Khóa học không tồn tại.");
        }

        lesson.setCourse(course);
        return lessonRepository.save(lesson);
    }

    public Lesson getLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId).orElse(null);
    }

    public Lesson updateLesson(Long lessonId, String title, String content, Integer order, String videoUrl,
            String resourceUrl, String resourceName, String meetingUrl, LocalDateTime startTime) {
        Lesson lesson = getLessonById(lessonId);
        if (lesson != null) {
            lesson.updateLesson(title, content, order, videoUrl, resourceUrl, resourceName, meetingUrl, startTime);
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

    // --- Enrollment ---

    public List<Course> searchCourses(String keyword) {
        if (keyword != null && !keyword.trim().isEmpty()) {
            return courseRepository.findByTitleContainingIgnoreCase(keyword.trim());
        }
        return courseRepository.findAll();
    }

    public boolean enrollCourse(Long courseId, Long userId) {
        if (enrollmentRepository.existsByCourseCourseIdAndUserId(courseId, userId)) {
            return false;
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

    public boolean approveCourse(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course != null) {
            course.setActive(true);
            courseRepository.save(course);
            return true;
        }
        return false;
    }

    // Dành cho Admin/Manager (xét duyệt)
    public List<Course> getAllCoursesForAdmin() {
        return courseRepository.findAll();
    }

    // Khóa học đã được duyệt
    public List<Course> getPublishedCourses() {
        return courseRepository.findByIsActive(true);
    }

    public void markLessonAsComplete(Long userId, Long courseId, Long lessonId) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Bài học không tồn tại"));

        // Bài học phải thuộc khóa học đang gửi lên
        if (!lesson.getCourse().getCourseId().equals(courseId)) {
            throw new RuntimeException("Bài học không thuộc khóa học này");
        }

        // Học sinh phải đăng ký khóa học trước khi đánh dấu hoàn thành
        boolean isEnrolled = enrollmentRepository.existsByCourseCourseIdAndUserId(courseId, userId);
        if (!isEnrolled) {
            throw new RuntimeException("Bạn chưa đăng ký khóa học này!");
        }

        LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElse(new LessonProgress());

        if (progress.getId() == null) {
            progress.setUserId(userId);
            progress.setLessonId(lessonId);
            progress.setCourseId(courseId);
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        lessonProgressRepository.save(progress);
    }

    // % tiến độ khóa học
    public double getCourseProgress(Long userId, Long courseId) {
        long totalLessons = lessonRepository.countByCourseCourseId(courseId);
        if (totalLessons == 0)
            return 0.0;

        long completedLessons = lessonProgressRepository.countByUserIdAndCourseIdAndIsCompleted(userId, courseId, true);

        return (double) completedLessons / totalLessons * 100;
    }

    public List<Long> getCompletedLessonIds(Long userId, Long courseId) {
        List<LessonProgress> progressList = lessonProgressRepository
                .findByUserIdAndCourseIdAndIsCompleted(userId, courseId, true);

        return progressList.stream()
                .map(LessonProgress::getLessonId)
                .collect(Collectors.toList());
    }

    public List<com.igcse.course.dto.StudentProgressDTO> getStudentProgressSummary(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(studentId);

        return enrollments.stream().map(enrollment -> {
            Course course = enrollment.getCourse();

            double progress = getCourseProgress(studentId, course.getCourseId());

            long totalLessons = lessonRepository.countByCourseCourseId(course.getCourseId());
            long completedLessons = lessonProgressRepository.countByUserIdAndCourseIdAndIsCompleted(studentId,
                    course.getCourseId(), true);

            com.igcse.course.dto.StudentProgressDTO dto = new com.igcse.course.dto.StudentProgressDTO();
            dto.setCourseId(course.getCourseId());
            dto.setCourseTitle(course.getTitle());
            dto.setProgress(progress);
            dto.setTotalLessons((int) totalLessons);
            dto.setCompletedLessons((int) completedLessons);

            return dto;
        }).collect(Collectors.toList());
    }
}