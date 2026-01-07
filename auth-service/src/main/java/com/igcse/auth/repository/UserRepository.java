package com.igcse.auth.repository;

import com.igcse.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Tìm user bằng email (Dùng cho lúc Đăng nhập)
    Optional<User> findByEmail(String email);

    // Kiểm tra xem email đã tồn tại chưa (Dùng cho lúc Đăng ký)
    boolean existsByEmail(String email);
}