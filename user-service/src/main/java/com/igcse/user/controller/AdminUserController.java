package com.igcse.user.controller;

import com.igcse.user.entity.User;
import com.igcse.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import com.igcse.user.dto.UpdateRoleRequest;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://localhost:5174" })
public class AdminUserController {

    @Autowired
    private UserService userService;

    // API: Lấy danh sách user có phân trang & tìm kiếm (GET /api/admin/users)
    @GetMapping
    public Page<User> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "7") int size) {
        return userService.getUsers(keyword, role, page, size);
    }

    // API: Xóa user (DELETE /api/admin/users/1)
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    // API: Vô hiệu hóa user (PATCH /api/admin/users/1/deactivate)
    @PatchMapping("/{id}/deactivate")
    public void deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
    }

    // API: Bật lại user (PATCH /api/admin/users/1/activate)
    @PatchMapping("/{id}/activate")
    public void activateUser(@PathVariable Long id) {
        userService.activateUser(id);
    }

    // API: Cập nhật Role (PATCH /api/admin/users/1/role)
    @PatchMapping("/{id}/role")
    public void updateUserRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest request) {
        userService.updateUserRole(id, request.getRole());
    }
}
