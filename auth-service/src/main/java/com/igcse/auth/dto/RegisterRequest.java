package com.igcse.auth.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String role; // "STUDENT" hoặc "ADMIN"

    // Constructor mặc định
    public RegisterRequest() {}

    // Getter & Setter
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}