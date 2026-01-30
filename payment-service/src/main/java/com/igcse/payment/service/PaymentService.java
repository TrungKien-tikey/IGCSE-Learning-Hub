package com.igcse.payment.service;

import com.igcse.payment.dto.*;
import com.igcse.payment.entity.*;
import com.igcse.payment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.client.RestTemplate;

/**
 * Service xử lý giao dịch thanh toán
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final CourseSlotPackageRepository packageRepository;
    private final SlotTransactionRepository slotTransactionRepository;
    private final CourseTransactionRepository courseTransactionRepository;
    private final TeacherSlotRepository teacherSlotRepository;
    private final TransactionRepository transactionRepository;

    // ==================== SLOT PACKAGES ====================

    /**
     * Lấy danh sách gói suất học đang bán
     */
    public List<SlotPackageDTO> getActivePackages() {
        log.info("Getting active slot packages");

        return packageRepository.findByIsActiveTrue().stream()
                .map(this::convertToPackageDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả gói suất học (bao gồm cả không hoạt động)
     */
    public List<SlotPackageDTO> getAllPackages() {
        log.info("Getting all slot packages");

        return packageRepository.findAll().stream()
                .map(this::convertToPackageDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin một gói
     */
    public SlotPackageDTO getPackageById(Long id) {
        return packageRepository.findById(id)
                .map(this::convertToPackageDTO)
                .orElse(null);
    }

    private SlotPackageDTO convertToPackageDTO(CourseSlotPackage p) {
        return SlotPackageDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .slotCount(p.getSlotCount())
                .price(p.getPrice())
                .durationDays(p.getDurationDays())
                .isActive(p.getIsActive())
                .build();
    }

    /**
     * Tạo gói suất học mới
     */
    @Transactional
    public CourseSlotPackage createPackage(SlotPackageDTO dto) {
        log.info("Creating new slot package: {}", dto.getName());

        CourseSlotPackage pkg = CourseSlotPackage.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .slotCount(dto.getSlotCount())
                .price(dto.getPrice())
                .durationDays(dto.getDurationDays() != null ? dto.getDurationDays() : 365)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        return packageRepository.save(pkg);
    }

    /**
     * Cập nhật gói suất học
     */
    @Transactional
    public CourseSlotPackage updatePackage(Long id, SlotPackageDTO dto) {
        log.info("Updating slot package ID: {}", id);

        CourseSlotPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói suất học ID: " + id));

        if (dto.getName() != null)
            pkg.setName(dto.getName());
        if (dto.getDescription() != null)
            pkg.setDescription(dto.getDescription());
        if (dto.getSlotCount() != null)
            pkg.setSlotCount(dto.getSlotCount());
        if (dto.getPrice() != null)
            pkg.setPrice(dto.getPrice());
        if (dto.getDurationDays() != null)
            pkg.setDurationDays(dto.getDurationDays());
        if (dto.getIsActive() != null)
            pkg.setIsActive(dto.getIsActive());

        return packageRepository.save(pkg);
    }

    /**
     * Xóa gói suất học (soft delete - đánh dấu không hoạt động)
     */
    @Transactional
    public void deletePackage(Long id) {
        log.info("Deleting slot package ID: {}", id);

        CourseSlotPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói suất học ID: " + id));

        pkg.setIsActive(false);
        packageRepository.save(pkg);
    }

    /**
     * Bật/tắt trạng thái gói suất học
     */
    @Transactional
    public CourseSlotPackage togglePackageStatus(Long id) {
        log.info("Toggling slot package status ID: {}", id);

        CourseSlotPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói suất học ID: " + id));

        pkg.setIsActive(!pkg.getIsActive());
        return packageRepository.save(pkg);
    }

    // ==================== SLOT PURCHASE ====================

    /**
     * Giáo viên mua gói suất học
     */
    @Transactional
    public SlotTransaction purchaseSlotPackage(PurchaseSlotRequestDTO request) {
        log.info("Teacher {} purchasing slot package {}", request.getTeacherId(), request.getPackageId());

        // 1. Lấy thông tin gói
        CourseSlotPackage slotPackage = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói suất học ID: " + request.getPackageId()));

        if (!slotPackage.getIsActive()) {
            throw new RuntimeException("Gói suất học này không còn được bán!");
        }

        // 2. Tạo giao dịch mua suất học
        SlotTransaction slotTransaction = SlotTransaction.builder()
                .teacherId(request.getTeacherId())
                .teacherName(request.getTeacherName())
                .packageId(slotPackage.getId())
                .packageName(slotPackage.getName())
                .slotsPurchased(slotPackage.getSlotCount())
                .amount(slotPackage.getPrice())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "BANK_TRANSFER")
                .paymentStatus("PENDING")
                .notes(request.getNotes())
                .build();

        slotTransaction = slotTransactionRepository.save(slotTransaction);

        // 3. Tạo bản ghi Transaction tổng hợp
        Transaction transaction = Transaction.fromSlotTransaction(slotTransaction);
        transactionRepository.save(transaction);

        log.info("Created slot transaction ID: {} for teacher ID: {}",
                slotTransaction.getId(), request.getTeacherId());

        return slotTransaction;
    }

    /**
     * Xác nhận thanh toán suất học hoàn thành
     */
    @Transactional
    public SlotTransaction confirmSlotPayment(Long transactionId) {
        log.info("Confirming slot payment for transaction ID: {}", transactionId);

        SlotTransaction slotTransaction = slotTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + transactionId));

        if ("COMPLETED".equals(slotTransaction.getPaymentStatus())) {
            throw new RuntimeException("Giao dịch này đã được xác nhận trước đó!");
        }

        // 1. Đánh dấu giao dịch hoàn thành
        slotTransaction.markAsCompleted();
        slotTransactionRepository.save(slotTransaction);

        // 2. Cập nhật số suất của giáo viên
        TeacherSlot teacherSlot = teacherSlotRepository.findByTeacherId(slotTransaction.getTeacherId())
                .orElseGet(() -> TeacherSlot.builder()
                        .teacherId(slotTransaction.getTeacherId())
                        .teacherName(slotTransaction.getTeacherName())
                        .totalSlots(0)
                        .usedSlots(0)
                        .availableSlots(0)
                        .build());

        teacherSlot.addSlots(slotTransaction.getSlotsPurchased());
        teacherSlotRepository.save(teacherSlot);

        // 3. Cập nhật Transaction tổng hợp
        // (Tìm transaction theo reference_id và type)
        // Đơn giản hóa: tạo mới với trạng thái COMPLETED
        Transaction transaction = Transaction.fromSlotTransaction(slotTransaction);
        transaction.markAsCompleted();
        transactionRepository.save(transaction);

        log.info("Confirmed slot payment - Teacher {} now has {} available slots",
                slotTransaction.getTeacherId(), teacherSlot.getAvailableSlots());

        return slotTransaction;
    }

    // ==================== COURSE PURCHASE ====================

    /**
     * Học sinh mua khóa học
     */
    @Transactional
    public CourseTransaction purchaseCourse(PurchaseCourseRequestDTO request) {
        log.info("Student {} purchasing course {}", request.getStudentId(), request.getCourseId());

        // Tính số tiền thực tế
        BigDecimal amount = request.getOriginalPrice();
        if (request.getDiscountAmount() != null) {
            amount = amount.subtract(request.getDiscountAmount());
        }

        // Tạo giao dịch mua khóa học
        CourseTransaction courseTransaction = CourseTransaction.builder()
                .studentId(request.getStudentId())
                .studentName(request.getStudentName())
                .courseId(request.getCourseId())
                .courseTitle(request.getCourseTitle())
                .teacherId(request.getTeacherId())
                .teacherName(request.getTeacherName())
                .originalPrice(request.getOriginalPrice())
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .amount(amount)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "BANK_TRANSFER")
                .paymentStatus("PENDING")
                .notes(request.getNotes())
                .build();

        courseTransaction = courseTransactionRepository.save(courseTransaction);

        // Tạo bản ghi Transaction tổng hợp
        Transaction transaction = Transaction.fromCourseTransaction(courseTransaction);
        transactionRepository.save(transaction);

        log.info("Created course transaction ID: {} for student ID: {}",
                courseTransaction.getId(), request.getStudentId());

        return courseTransaction;
    }

    /**
     * Xác nhận thanh toán khóa học hoàn thành
     */
    @Transactional
    public CourseTransaction confirmCoursePayment(Long transactionId) {
        log.info("Confirming course payment for transaction ID: {}", transactionId);

        CourseTransaction courseTransaction = courseTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + transactionId));

        if ("COMPLETED".equals(courseTransaction.getPaymentStatus())) {
            throw new RuntimeException("Giao dịch này đã được xác nhận trước đó!");
        }

        // Đánh dấu hoàn thành
        courseTransaction.markAsCompleted();
        courseTransactionRepository.save(courseTransaction);

        // Cập nhật Transaction tổng hợp
        Transaction transaction = Transaction.fromCourseTransaction(courseTransaction);
        transaction.markAsCompleted();
        transactionRepository.save(transaction);

        log.info("Confirmed course payment - Student {} enrolled in course {}",
                courseTransaction.getStudentId(), courseTransaction.getCourseId());

        // Call Course Service to enroll student
        // Assuming course-service is reachable at http://course-service:8080
        try {
            RestTemplate restTemplate = new RestTemplate();
            String courseServiceUrl = "http://course-service:8080/api/v1/courses/internal/"
                    + courseTransaction.getCourseId() + "/enroll?userId=" + courseTransaction.getStudentId();

            restTemplate.postForEntity(courseServiceUrl, null, String.class);
            log.info("Successfully triggered enrollment in Course Service");
        } catch (Exception e) {
            log.error("Failed to call Course Service for enrollment: {}", e.getMessage());
            // Note: transaction is already COMPLETED, so we might need manual intervention
            // or retry mechanism
            // For MVP, we just log error.
        }

        return courseTransaction;
    }

    // ==================== TEACHER SLOTS ====================

    /**
     * Lấy thông tin suất học của giáo viên
     */
    public TeacherSlot getTeacherSlots(Long teacherId) {
        return teacherSlotRepository.findByTeacherId(teacherId).orElse(null);
    }

    /**
     * Kiểm tra giáo viên còn suất học không
     */
    public boolean hasAvailableSlots(Long teacherId) {
        return teacherSlotRepository.findByTeacherId(teacherId)
                .map(TeacherSlot::hasAvailableSlots)
                .orElse(false);
    }

    /**
     * Sử dụng một suất học (khi tạo khóa học)
     */
    @Transactional
    public boolean useSlot(Long teacherId) {
        TeacherSlot teacherSlot = teacherSlotRepository.findByTeacherId(teacherId).orElse(null);
        if (teacherSlot != null && teacherSlot.useSlot()) {
            teacherSlotRepository.save(teacherSlot);
            log.info("Teacher {} used 1 slot, {} remaining", teacherId, teacherSlot.getAvailableSlots());
            return true;
        }
        return false;
    }

    /**
     * Hoàn trả suất học (khi xóa khóa học)
     */
    @Transactional
    public void returnSlot(Long teacherId) {
        teacherSlotRepository.findByTeacherId(teacherId).ifPresent(slot -> {
            slot.returnSlot();
            teacherSlotRepository.save(slot);
            log.info("Returned 1 slot to teacher {}, {} now available", teacherId, slot.getAvailableSlots());
        });
    }
}
