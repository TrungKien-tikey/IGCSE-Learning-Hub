package com.igcse.user.controller;

import com.igcse.user.entity.User;
import com.igcse.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://localhost:5174" })
public class UserProfileController {

    @Autowired
    private UserService userService;

    // API: Xem thông tin user (GET /api/users/1)
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // API: Cập nhật tên & avatar (PUT /api/users/1)
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userService.updateUser(id, body.get("fullName"), body.get("avatar"));
    }
}
