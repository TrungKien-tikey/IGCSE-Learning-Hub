package com.igcse.user;

import com.igcse.user.entity.User;
import com.igcse.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Arrays;

@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserServiceApplication.class, args);
	}

	// Dữ liệu mẫu
	@Bean
	CommandLineRunner init(UserRepository userRepository) {
		return args -> {
			// Kiểm tra xem đã có dữ liệu chưa để tránh duplicate khi restart
			if (userRepository.count() == 0) {
				User student = new User();
				student.setUserId(1L); // Gán ID thủ công
				student.setFullName("Nguyen Van A");
				student.setEmail("student@example.com");
				student.setRole("STUDENT");
				student.setActive(true);

				User admin = new User();
				admin.setUserId(2L); // Gán ID thủ công
				admin.setFullName("Admin User");
				admin.setEmail("admin@example.com");
				admin.setRole("ADMIN");
				admin.setActive(true);

				User instructor = new User();
				instructor.setUserId(3L); // Gán ID thủ công
				instructor.setFullName("Le Thi Giao Vien");
				instructor.setEmail("teacher@example.com");
				instructor.setRole("INSTRUCTOR");
				instructor.setActive(true);

				userRepository.saveAll(Arrays.asList(student, admin, instructor));
				System.out.println(">>> Đã khởi tạo dữ liệu mẫu thành công!");
			}
		};
	}
}
