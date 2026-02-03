package com.igcse.user.controller;

import com.igcse.user.entity.User;
import com.igcse.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.igcse.user.dto.UpdateProfileRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://localhost:5174" })
public class UserProfileController {

    @Autowired
    private UserService userService;

    @GetMapping("/health")
    public java.util.Map<String, String> health() {
        return java.util.Map.of("status", "UP");
    }

    // API: Lấy danh sách users (Admin dùng để xem, duyệt GV, v.v)
    @GetMapping
    public org.springframework.data.domain.Page<User> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return userService.getUsers(keyword, role, page, size);
    }

    // API: Xem thông tin chính mình (Dùng Token)
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        Long currentUserId = com.igcse.user.util.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getUserById(currentUserId));
    }

    // API: Cập nhật profile chính mình (Dùng Token)
    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Long currentUserId = com.igcse.user.util.SecurityUtils.getCurrentUserId();
        User updatedUser = userService.updateUser(
                currentUserId,
                request.getFullName(),
                request.getPhone(),
                request.getAddress(),
                request.getBio(),
                request.getAvatar(),
                request.getQualifications(),
                request.getSubjects(),
                request.getVerificationDocument());
        return ResponseEntity.ok(updatedUser);
    }

    // API: Tìm kiếm user theo Email (Hỗ trợ Phụ huynh tìm con)
    @GetMapping("/search")
    public ResponseEntity<User> getUserByEmail(@RequestParam String email) {
        User user = userService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    // Giữ lại API theo ID nếu cần (ví dụ Admin xem)
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // API: Admin duyệt giáo viên (Yêu cầu Role ADMIN - sẽ cấu hình Security sau)
    @PutMapping("/{id}/verify")
    public ResponseEntity<User> verifyTeacher(@PathVariable Long id,
            @RequestParam com.igcse.user.enums.VerificationStatus status) {
        // TODO: Check Admin Permission here or via SecurityConfig
        User updatedUser = userService.verifyTeacher(id, status);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }
}
