package com.igsce.exam_service.repository;

import com.igsce.exam_service.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    // Bạn có thể thêm các hàm tìm kiếm tùy chỉnh ở đây nếu cần sau này
}
