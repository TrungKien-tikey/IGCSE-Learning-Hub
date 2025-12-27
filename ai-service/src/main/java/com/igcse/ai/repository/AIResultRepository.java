package com.igcse.ai.repository;

import com.igcse.ai.entity.AIResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Lớp AIResultRepository chịu trách nhiệm truy cập và lưu trữ dữ liệu kết quả chấm điểm
 */
@Repository
public interface AIResultRepository extends JpaRepository<AIResult, Long> {

    /**
     * Lấy kết quả theo bài làm
     * @param attemptId - Mã bài làm
     * @return AIResult - Kết quả chấm điểm
     */
    Optional<AIResult> findByAttemptId(Long attemptId);
}

