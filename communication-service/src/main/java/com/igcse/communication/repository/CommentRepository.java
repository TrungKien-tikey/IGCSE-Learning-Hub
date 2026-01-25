package com.igcse.communication.repository;

import com.igcse.communication.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Đổi từ findByTargetId... thành findByExamId...
    List<Comment> findByExamIdOrderByCreatedAtDesc(Long examId);
}