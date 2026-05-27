package com.example.demo.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private Long id;
    private String username;
    private String displayName;
    private String role;
    private String avatar;
    private String email;
    private String phone;
    private String token;
}
