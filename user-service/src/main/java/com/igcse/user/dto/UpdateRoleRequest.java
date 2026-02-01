package com.igcse.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateRoleRequest {
    @NotBlank(message = "Role không được để trống")
    @Pattern(regexp = "^(ADMIN|STUDENT|TEACHER|PARENT|MANAGER)$", message = "Role không hợp lệ")
    private String role;
}
