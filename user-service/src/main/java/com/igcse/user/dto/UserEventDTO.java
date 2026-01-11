package com.igcse.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserEventDTO {
    private String action; // "UPDATE", "DELETE", "DEACTIVATE", "ACTIVATE"
    private Long userId;
    private String fullName;
    private String role;
    private Boolean isActive;
}
