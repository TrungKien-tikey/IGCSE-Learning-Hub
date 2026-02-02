package com.igcse.user.consumer;

import com.igcse.user.dto.UserSyncDTO;
import com.igcse.user.entity.User;
import com.igcse.user.repository.UserRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserSyncConsumer {

    @Autowired
    private UserRepository userRepository;

    @RabbitListener(queues = "user.sync.queue")
    public void consumeUserSync(UserSyncDTO dto) {
        System.out.println("Received user sync event for: " + dto.getEmail());

        try {
            // Kiểm tra xem user đã tồn tại chưa (theo EMAIL vì email là UNIQUE)
            Optional<User> existingUser = userRepository.findByEmail(dto.getEmail());

            if (existingUser.isPresent()) {
                // User đã tồn tại -> UPDATE thông tin
                User user = existingUser.get();
                user.setFullName(dto.getFullName());
                user.setRole(dto.getRole());
                user.setActive(true);
                userRepository.save(user);
                System.out.println("Updated existing user in user_db: " + dto.getEmail());
            } else {
                // User chưa tồn tại -> INSERT mới
                User user = new User();
                user.setUserId(dto.getUserId());
                user.setEmail(dto.getEmail());
                user.setFullName(dto.getFullName());
                user.setRole(dto.getRole());

                // Generate Link Code for Student
                if ("STUDENT".equals(dto.getRole())) {
                    String linkCode = "HS-" + (int) (Math.random() * 900000 + 100000);
                    user.setLinkCode(linkCode);
                    System.out.println("Generated LinkCode for " + dto.getEmail() + ": " + linkCode);
                }

                user.setActive(true);
                userRepository.save(user);
                System.out.println("Successfully synced new user to user_db: " + dto.getEmail());
            }
        } catch (Exception e) {
            // Log lỗi nhưng KHÔNG throw exception để tránh RabbitMQ retry vô hạn
            System.err.println("Error syncing user " + dto.getEmail() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
