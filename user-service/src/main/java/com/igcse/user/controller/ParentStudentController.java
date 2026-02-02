package com.igcse.user.controller;

import com.igcse.user.entity.ParentStudentRelationship;
import com.igcse.user.service.ParentStudentService;
import com.igcse.user.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/relationships")
@CrossOrigin(origins = "*")
public class ParentStudentController {

    @Autowired
    private ParentStudentService relationshipService;

    // 1. Phụ huynh kết nối bằng Link Code (Mới)
    @PostMapping("/connect-by-code")
    public ResponseEntity<?> connectByCode(@RequestBody Map<String, String> payload) {
        try {
            Long parentId = SecurityUtils.getCurrentUserId();
            String linkCode = payload.get("linkCode");

            if (linkCode == null || linkCode.isEmpty()) {
                return ResponseEntity.badRequest().body("Vui lòng nhập mã liên kết");
            }

            ParentStudentRelationship rel = relationshipService.connectByLinkCode(parentId, linkCode);
            return ResponseEntity.ok(rel);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 1b. Phụ huynh gửi yêu cầu kết nối bằng email (Cũ - Giữ lại để backup nếu cần)
    @PostMapping("/request")
    public ResponseEntity<?> requestConnection(@RequestBody Map<String, String> payload) {
        try {
            Long parentId = SecurityUtils.getCurrentUserId();
            String studentEmail = payload.get("studentEmail");

            if (studentEmail == null || studentEmail.isEmpty()) {
                return ResponseEntity.badRequest().body("Student email is required");
            }

            ParentStudentRelationship rel = relationshipService.requestConnection(parentId, studentEmail);
            return ResponseEntity.ok(rel);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Học sinh chấp nhận kết nối
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptConnection(@PathVariable Long id) {
        try {
            Long studentId = SecurityUtils.getCurrentUserId();
            ParentStudentRelationship rel = relationshipService.acceptConnection(studentId, id);
            return ResponseEntity.ok(rel);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<?> disconnectStudent(@RequestBody Map<String, Long> payload) {
        try {
            Long parentId = SecurityUtils.getCurrentUserId();
            Long studentId = payload.get("studentId");

            if (studentId == null) {
                return ResponseEntity.badRequest().body("Thiếu studentId");
            }

            relationshipService.disconnect(parentId, studentId);
            return ResponseEntity.ok("Hủy liên kết thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Phụ huynh xem danh sách con (Chi tiết)
    @GetMapping("/children-details")
    public ResponseEntity<List<Map<String, Object>>> getMyChildrenDetails() {
        Long parentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(relationshipService.getMyChildrenDetails(parentId));
    }

    // 3b. Phụ huynh xem danh sách con (Raw Relationship)
    @GetMapping("/children")
    public ResponseEntity<List<ParentStudentRelationship>> getMyChildren() {
        Long parentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(relationshipService.getMyChildren(parentId));
    }

    // 4. Học sinh xem danh sách phụ huynh (nếu cần)
    @GetMapping("/parents")
    public ResponseEntity<List<ParentStudentRelationship>> getMyParents() {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(relationshipService.getMyParents(studentId));
    }
}
