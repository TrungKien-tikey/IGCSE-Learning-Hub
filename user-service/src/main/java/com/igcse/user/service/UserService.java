package com.igcse.user.service;

import com.igcse.user.config.RabbitMQConfig;
import com.igcse.user.dto.UserEventDTO;
import com.igcse.user.entity.User;
import com.igcse.user.repository.UserRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User updateUser(Long id, String fullName, String phone, String address, String bio, String avatar) {
        User user = getUserById(id);
        if (user != null) {
            user.setFullName(fullName);
            user.setPhoneNumber(phone);
            user.setAddress(address);
            user.setBio(bio);
            if (avatar != null) {
                user.setAvatar(avatar);
            }
            User savedUser = userRepository.save(user);

            // Gửi event đồng bộ sang Auth Service
            sendUserEvent("UPDATE", savedUser);

            return savedUser;
        }
        return null;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> getUsers(String keyword, String role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("userId").descending());
        return userRepository.searchUsers(keyword, role, pageable);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        if (user != null) {
            // Gửi event xóa trước khi xóa khỏi DB
            sendUserEvent("DELETE", user);
            userRepository.deleteById(id);
        }
    }

    public void deactivateUser(Long id) {
        User user = getUserById(id);
        if (user != null) {
            user.setActive(false);
            User savedUser = userRepository.save(user);

            // Gửi event đồng bộ sang Auth Service
            sendUserEvent("DEACTIVATE", savedUser);
        }
    }

    public void activateUser(Long id) {
        User user = getUserById(id);
        if (user != null) {
            user.setActive(true);
            User savedUser = userRepository.save(user);

            // Gửi event đồng bộ sang Auth Service
            sendUserEvent("ACTIVATE", savedUser);
        }
    }

    public void updateUserRole(Long id, String newRole) {
        User user = getUserById(id);
        if (user != null) {
            user.setRole(newRole);
            User savedUser = userRepository.save(user);

            // Gửi event đồng bộ sang Auth Service
            sendUserEvent("UPDATE", savedUser);
        }
    }

    // ========== HELPER METHOD ==========
    private void sendUserEvent(String action, User user) {
        try {
            UserEventDTO event = new UserEventDTO(
                    action,
                    user.getUserId(),
                    user.getFullName(),
                    user.getRole(),
                    user.isActive());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.USER_UPDATE_EXCHANGE,
                    RabbitMQConfig.USER_UPDATE_ROUTING_KEY,
                    event);

            System.out.println(">>> [RabbitMQ] Da gui event " + action + " cho user: " + user.getUserId());

        } catch (Exception e) {
            System.err.println(">>> [RabbitMQ] Loi gui tin nhan: " + e.getMessage());
        }
    }
}
