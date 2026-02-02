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

    @Autowired
    private com.igcse.user.repository.TeacherRepository teacherRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    @org.springframework.transaction.annotation.Transactional
    public User updateUser(Long id, String fullName, String phone, String address, String bio, String avatar,
            String qualifications, String subjects, String verificationDocument) {
        User user = getUserById(id);
        if (user != null) {
            user.setFullName(fullName);
            user.setPhoneNumber(phone);
            user.setAddress(address);
            user.setBio(bio);
            if (avatar != null) {
                user.setAvatar(avatar);
            }

            // Teacher fields update
            if ("TEACHER".equals(user.getRole())) {
                com.igcse.user.entity.Teacher teacher = user.getTeacherProfile();
                if (teacher == null) {
                    teacher = new com.igcse.user.entity.Teacher();
                    teacher.setUser(user);
                    // teacher.setUserId(user.getUserId()); // MapsId handles this
                    user.setTeacherProfile(teacher);
                }

                if (qualifications != null)
                    teacher.setQualifications(qualifications);
                if (subjects != null)
                    teacher.setSubjects(subjects);

                if (verificationDocument != null && !verificationDocument.isEmpty()) {
                    teacher.setVerificationDocument(verificationDocument);
                    // Always reset status to PENDING on document update to force re-verification
                    teacher.setVerificationStatus(com.igcse.user.enums.VerificationStatus.PENDING);
                }

                teacherRepository.save(teacher);

                // Trigger sync nếu có update document (đã reset về PENDING)
                if (verificationDocument != null && !verificationDocument.isEmpty()) {
                    sendUserEvent("UPDATE", user);
                }
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

    public User verifyTeacher(Long userId, com.igcse.user.enums.VerificationStatus status) {
        User user = getUserById(userId);
        if (user != null && user.getTeacherProfile() != null) {
            user.getTeacherProfile().setVerificationStatus(status);
            User savedUser = userRepository.save(user); // Lưu xong thì gửi event

            // Trigger sync
            sendUserEvent("UPDATE", savedUser);
            return savedUser;
        }
        return null;
    }

    // ========== HELPER METHOD ==========
    private void sendUserEvent(String action, User user) {
        try {
            // Lấy status nếu là teacher
            String vStatus = null;
            if (user.getTeacherProfile() != null) {
                vStatus = user.getTeacherProfile().getVerificationStatus() != null
                        ? user.getTeacherProfile().getVerificationStatus().name()
                        : "NONE";
            }

            UserEventDTO event = new UserEventDTO(
                    action,
                    user.getUserId(),
                    user.getFullName(),
                    user.getRole(),
                    user.isActive(),
                    vStatus); // Thêm status vào event

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
