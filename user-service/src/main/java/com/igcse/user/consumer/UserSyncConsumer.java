package com.igcse.user.consumer;

import com.igcse.user.dto.UserSyncDTO;
import com.igcse.user.entity.User;
import com.igcse.user.repository.UserRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserSyncConsumer {

    @Autowired
    private UserRepository userRepository;

    @RabbitListener(queues = "user.sync.queue")
    public void consumeUserSync(UserSyncDTO dto) {
        System.out.println("Received user sync event for: " + dto.getEmail());

        // Kiểm tra xem user đã tồn tại chưa
        if (userRepository.existsById(dto.getUserId())) {
            System.out.println("User already exists, skipping sync.");
            return;
        }

        User user = new User();
        user.setUserId(dto.getUserId());
        user.setEmail(dto.getEmail());
        user.setFullName(dto.getFullName());
        user.setRole(dto.getRole());
        user.setActive(true);

        userRepository.save(user);
        System.out.println("Successfully synced user to user_db: " + dto.getEmail());
    }
}
