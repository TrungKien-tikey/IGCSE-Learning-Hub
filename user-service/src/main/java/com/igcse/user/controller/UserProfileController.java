package com.igcse.user.controller;

import com.igcse.user.entity.User;
import com.igcse.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://localhost:5174" })
public class UserProfileController {

    @Autowired
    private UserService userService;

    // API: Xem thông tin chính mình (Dùng Token)
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        Long currentUserId = com.igcse.user.util.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getUserById(currentUserId));
    }

    // API: Cập nhật profile chính mình (Dùng Token)
    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(@RequestBody Map<String, String> body) {
        Long currentUserId = com.igcse.user.util.SecurityUtils.getCurrentUserId();
        User updatedUser = userService.updateUser(currentUserId, body.get("fullName"), body.get("avatar"));
        return ResponseEntity.ok(updatedUser);
    }

    // Giữ lại API theo ID nếu cần (ví dụ Admin xem)
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
