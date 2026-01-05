package com.igcse.user.service;

import com.igcse.user.entity.User;
import com.igcse.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User updateUser(Long id, String fullName, String avatar) {
        User user = getUserById(id);
        if (user != null) {
            user.setFullName(fullName);
            if (avatar != null) {
                user.setAvatar(avatar);
            }
            return userRepository.save(user);
        }
        return null;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public void deactivateUser(Long id) {
        User user = getUserById(id);
        if (user != null) {
            user.setActive(false);
            userRepository.save(user);
        }
    }

    public void activateUser(Long id) {
        User user = getUserById(id);
        if (user != null) {
            user.setActive(true);
            userRepository.save(user);
        }
    }
}