package com.igcse.payment.controller;

import com.igcse.payment.dto.*;
import com.igcse.payment.entity.*;
import com.igcse.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller xử lý giao dịch thanh toán
 */
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment", description = "API xử lý giao dịch thanh toán")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    // ==================== SLOT PACKAGES ====================

    @GetMapping("/packages")
    @Operation(summary = "Danh sách gói suất học", description = "Lấy danh sách gói suất học đang bán")
    public ResponseEntity<List<SlotPackageDTO>> getActivePackages() {
        log.info("API: Get active slot packages");
        List<SlotPackageDTO> packages = paymentService.getActivePackages();
        return ResponseEntity.ok(packages);
    }

    @GetMapping("/packages/all")
    @Operation(summary = "Tất cả gói suất học", description = "Lấy tất cả gói suất học (bao gồm không hoạt động)")
    public ResponseEntity<List<SlotPackageDTO>> getAllPackages() {
        log.info("API: Get all slot packages");
        List<SlotPackageDTO> packages = paymentService.getAllPackages();
        return ResponseEntity.ok(packages);
    }

    @GetMapping("/packages/{id}")
    @Operation(summary = "Chi tiết gói suất học", description = "Lấy thông tin chi tiết một gói suất học")
    public ResponseEntity<SlotPackageDTO> getPackageById(@PathVariable Long id) {
        log.info("API: Get package {}", id);
        SlotPackageDTO pkg = paymentService.getPackageById(id);
        if (pkg == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(pkg);
    }

    @PostMapping("/packages")
    @Operation(summary = "Tạo gói suất học", description = "Admin tạo gói suất học mới")
    public ResponseEntity<?> createPackage(@Valid @RequestBody SlotPackageDTO request) {
        log.info("API: Creating package {}", request.getName());
        try {
            CourseSlotPackage pkg = paymentService.createPackage(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo gói suất học thành công!",
                    "id", pkg.getId(),
                    "name", pkg.getName()));
        } catch (Exception e) {
            log.error("Error creating package", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PutMapping("/packages/{id}")
    @Operation(summary = "Cập nhật gói suất học", description = "Admin cập nhật gói suất học")
    public ResponseEntity<?> updatePackage(@PathVariable Long id, @Valid @RequestBody SlotPackageDTO request) {
        log.info("API: Updating package {}", id);
        try {
            CourseSlotPackage pkg = paymentService.updatePackage(id, request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật gói suất học thành công!",
                    "id", pkg.getId(),
                    "name", pkg.getName()));
        } catch (Exception e) {
            log.error("Error updating package", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @DeleteMapping("/packages/{id}")
    @Operation(summary = "Xóa gói suất học", description = "Admin xóa (ẩn) gói suất học")
    public ResponseEntity<?> deletePackage(@PathVariable Long id) {
        log.info("API: Deleting package {}", id);
        try {
            paymentService.deletePackage(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã ẩn gói suất học!"));
        } catch (Exception e) {
            log.error("Error deleting package", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/packages/{id}/toggle")
    @Operation(summary = "Bật/tắt gói suất học", description = "Admin bật/tắt trạng thái gói suất học")
    public ResponseEntity<?> togglePackageStatus(@PathVariable Long id) {
        log.info("API: Toggling package status {}", id);
        try {
            CourseSlotPackage pkg = paymentService.togglePackageStatus(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", pkg.getIsActive() ? "Đã kích hoạt gói!" : "Đã ẩn gói!",
                    "isActive", pkg.getIsActive()));
        } catch (Exception e) {
            log.error("Error toggling package status", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    // ==================== SLOT PURCHASE ====================

    @PostMapping("/slots/purchase")
    @Operation(summary = "Mua suất học", description = "Giáo viên mua gói suất học")
    public ResponseEntity<?> purchaseSlotPackage(@Valid @RequestBody PurchaseSlotRequestDTO request) {
        log.info("API: Teacher {} purchasing package {}", request.getTeacherId(), request.getPackageId());
        try {
            SlotTransaction transaction = paymentService.purchaseSlotPackage(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã tạo yêu cầu mua suất học. Vui lòng thanh toán để hoàn tất.",
                    "transactionId", transaction.getId(),
                    "amount", transaction.getAmount(),
                    "status", transaction.getPaymentStatus()));
        } catch (Exception e) {
            log.error("Error purchasing slot package", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/slots/confirm/{transactionId}")
    @Operation(summary = "Xác nhận thanh toán suất học", description = "Admin xác nhận thanh toán suất học hoàn thành")
    public ResponseEntity<?> confirmSlotPayment(@PathVariable Long transactionId) {
        log.info("API: Confirming slot payment {}", transactionId);
        try {
            SlotTransaction transaction = paymentService.confirmSlotPayment(transactionId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã xác nhận thanh toán thành công!",
                    "transactionId", transaction.getId(),
                    "slotsPurchased", transaction.getSlotsPurchased(),
                    "status", transaction.getPaymentStatus()));
        } catch (Exception e) {
            log.error("Error confirming slot payment", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    // ==================== COURSE PURCHASE ====================

    @PostMapping("/course/purchase")
    @Operation(summary = "Mua khóa học", description = "Học sinh mua khóa học")
    public ResponseEntity<?> purchaseCourse(@Valid @RequestBody PurchaseCourseRequestDTO request) {
        log.info("API: Student {} purchasing course {}", request.getStudentId(), request.getCourseId());
        try {
            CourseTransaction transaction = paymentService.purchaseCourse(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã tạo yêu cầu mua khóa học. Vui lòng thanh toán để hoàn tất.",
                    "transactionId", transaction.getId(),
                    "amount", transaction.getAmount(),
                    "status", transaction.getPaymentStatus()));
        } catch (Exception e) {
            log.error("Error purchasing course", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/course/confirm/{transactionId}")
    @Operation(summary = "Xác nhận thanh toán khóa học", description = "Admin xác nhận thanh toán khóa học hoàn thành")
    public ResponseEntity<?> confirmCoursePayment(@PathVariable Long transactionId) {
        log.info("API: Confirming course payment {}", transactionId);
        try {
            CourseTransaction transaction = paymentService.confirmCoursePayment(transactionId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã xác nhận thanh toán thành công! Học sinh đã được ghi danh.",
                    "transactionId", transaction.getId(),
                    "courseId", transaction.getCourseId(),
                    "status", transaction.getPaymentStatus()));
        } catch (Exception e) {
            log.error("Error confirming course payment", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    // ==================== TEACHER SLOTS ====================

    @GetMapping("/teacher/{teacherId}/slots")
    @Operation(summary = "Thông tin suất học giáo viên", description = "Lấy thông tin suất học của một giáo viên")
    public ResponseEntity<?> getTeacherSlots(@PathVariable Long teacherId) {
        log.info("API: Get slots for teacher {}", teacherId);
        TeacherSlot slots = paymentService.getTeacherSlots(teacherId);
        if (slots == null) {
            return ResponseEntity.ok(Map.of(
                    "teacherId", teacherId,
                    "totalSlots", 0,
                    "usedSlots", 0,
                    "availableSlots", 0,
                    "message", "Giáo viên chưa mua suất học nào"));
        }
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/teacher/{teacherId}/check-slots")
    @Operation(summary = "Kiểm tra suất học", description = "Kiểm tra giáo viên còn suất học không")
    public ResponseEntity<Map<String, Object>> checkTeacherSlots(@PathVariable Long teacherId) {
        log.info("API: Check slots for teacher {}", teacherId);
        boolean hasSlots = paymentService.hasAvailableSlots(teacherId);
        return ResponseEntity.ok(Map.of(
                "teacherId", teacherId,
                "hasAvailableSlots", hasSlots,
                "message", hasSlots ? "Giáo viên còn suất học" : "Giáo viên hết suất học, vui lòng mua thêm"));
    }

    @PostMapping("/teacher/{teacherId}/use-slot")
    @Operation(summary = "Sử dụng suất học", description = "Trừ 1 suất khi giáo viên tạo khóa học mới")
    public ResponseEntity<Map<String, Object>> useTeacherSlot(@PathVariable Long teacherId) {
        log.info("API: Use slot for teacher {}", teacherId);
        boolean success = paymentService.useSlot(teacherId);
        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã trừ 1 suất học"));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Giáo viên không còn suất học. Vui lòng mua thêm gói suất học."));
        }
    }

    @PostMapping("/teacher/{teacherId}/return-slot")
    @Operation(summary = "Hoàn trả suất học", description = "Hoàn lại 1 suất khi giáo viên xóa khóa học")
    public ResponseEntity<Map<String, Object>> returnTeacherSlot(@PathVariable Long teacherId) {
        log.info("API: Return slot for teacher {}", teacherId);
        paymentService.returnSlot(teacherId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã hoàn trả 1 suất học"));
    }

    // ==================== HEALTH CHECK ====================

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Kiểm tra trạng thái service")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "payment-service"));
    }
}
