package com.igcse.user.repository;

import com.igcse.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Tìm kiếm user bằng ID đã có sẵn trong JpaRepository
}