package com.igcse.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSyncDTO {
    private Long userId;
    private String email;
    private String fullName;
    private String role;
}
