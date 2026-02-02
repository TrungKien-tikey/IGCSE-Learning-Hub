package com.igcse.auth.consumer;

import com.igcse.auth.config.RabbitMQConfig;
import com.igcse.auth.dto.UserEventDTO;
import com.igcse.auth.entity.User;
import com.igcse.auth.repository.UserRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserUpdateConsumer {

    @Autowired
    private UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.AUTH_USER_UPDATE_QUEUE)
    public void consumeUserUpdateEvent(UserEventDTO event) {
        System.out.println(">>> [Auth-Service] Nhan event: " + event.getAction() + " | UserID: " + event.getUserId());

        switch (event.getAction()) {
            case "UPDATE":
                handleUpdate(event);
                break;
            case "DELETE":
                handleDelete(event);
                break;
            case "DEACTIVATE":
            case "ACTIVATE":
                handleStatusChange(event);
                break;
            default:
                System.out.println(">>> [Auth-Service] Action khong ho tro: " + event.getAction());
        }
    }

    private void handleUpdate(UserEventDTO event) {
        userRepository.findById(event.getUserId()).ifPresentOrElse(
                user -> {
                    if (event.getFullName() != null)
                        user.setFullName(event.getFullName());
                    if (event.getRole() != null)
                        user.setRole(event.getRole());
                    // Sync status
                    if (event.getVerificationStatus() != null) {
                        user.setVerificationStatus(event.getVerificationStatus());
                    }
                    userRepository.save(user);
                    System.out.println(">>> [Auth-Service] Da cap nhat user: " + event.getUserId());
                },
                () -> System.out.println(">>> [Auth-Service] Khong tim thay user: " + event.getUserId()));
    }

    private void handleDelete(UserEventDTO event) {
        if (userRepository.existsById(event.getUserId())) {
            userRepository.deleteById(event.getUserId());
            System.out.println(">>> [Auth-Service] Da xoa user: " + event.getUserId());
        } else {
            System.out.println(">>> [Auth-Service] Khong tim thay user de xoa: " + event.getUserId());
        }
    }

    private void handleStatusChange(UserEventDTO event) {
        userRepository.findById(event.getUserId()).ifPresentOrElse(
                user -> {
                    user.setActive(event.getIsActive());
                    userRepository.save(user);
                    System.out.println(">>> [Auth-Service] Da thay doi trang thai user " + event.getUserId()
                            + " -> isActive=" + event.getIsActive());
                },
                () -> System.out.println(">>> [Auth-Service] Khong tim thay user: " + event.getUserId()));
    }
}
