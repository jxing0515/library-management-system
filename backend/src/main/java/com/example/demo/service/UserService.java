package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    public User create(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        user.setPassword(AuthService.encryptPassword(user.getPassword()));
        if (user.getStatus() == null) user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    public User update(Long id, User user) {
        var existing = findById(id);
        if (user.getDisplayName() != null) existing.setDisplayName(user.getDisplayName());
        if (user.getEmail() != null) existing.setEmail(user.getEmail());
        if (user.getPhone() != null) existing.setPhone(user.getPhone());
        if (user.getStatus() != null) existing.setStatus(user.getStatus());
        if (user.getRole() != null) existing.setRole(user.getRole());
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existing.setPassword(AuthService.encryptPassword(user.getPassword()));
        }
        return userRepository.save(existing);
    }

    public void delete(Long id) {
        var user = findById(id);
        userRepository.delete(user);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }
}
