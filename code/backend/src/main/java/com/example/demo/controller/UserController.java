package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.User;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping
    public ApiResponse<List<User>> findAll() {
        return ApiResponse.success(userService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<User> findById(@PathVariable Long id) {
        return ApiResponse.success(userService.findById(id));
    }

    @PostMapping
    public ApiResponse<User> create(@RequestBody User user) {
        try {
            return ApiResponse.success("创建成功", userService.create(user));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<User> update(@PathVariable Long id, @RequestBody User user) {
        try {
            return ApiResponse.success("更新成功", userService.update(id, user));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            userService.delete(id);
            return ApiResponse.success("删除成功", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/avatar")
    public ApiResponse<String> uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file, HttpServletRequest request) {
        try {
            if (file.isEmpty()) {
                return ApiResponse.error("请选择文件");
            }

            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ApiResponse.error("只允许上传图片文件");
            }

            // Check file size (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ApiResponse.error("文件大小不能超过5MB");
            }

            // Get file extension
            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // Generate unique filename
            String filename = id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

            // Ensure upload directory exists
            String uploadDir = "uploads/avatars";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Save file
            Path filePath = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Build avatar URL
            String avatarUrl = "/uploads/avatars/" + filename;

            // Update user entity
            try {
                var user = userService.findById(id);
                user.setAvatar(avatarUrl);
                userService.updateUser(user);
            } catch (Exception e) {
                // DB update failed, clean up orphaned file
                Files.deleteIfExists(filePath);
                throw e;
            }

            return ApiResponse.success("头像上传成功", avatarUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("头像上传失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/password")
    public ApiResponse<Void> updatePassword(@PathVariable Long id, @RequestBody Map<String, String> body, @RequestHeader("Authorization") String token) {
        try {
            String newPassword = body.get("password");
            if (newPassword == null || newPassword.isEmpty()) {
                return ApiResponse.error("密码不能为空");
            }
            if (newPassword.length() < 6) {
                return ApiResponse.error("密码至少 6 位");
            }

            // Only the user themselves can change their password
            User currentUser = authService.validateToken(token);
            if (currentUser == null || !currentUser.getId().equals(id)) {
                return ApiResponse.error(403, "无权修改其他用户的密码");
            }

            userService.updatePassword(id, newPassword);
            return ApiResponse.success("密码修改成功", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

}