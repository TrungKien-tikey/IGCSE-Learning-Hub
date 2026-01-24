package com.igcse.communication.repository;

import com.igcse.communication.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // Lấy danh sách bình luận theo targetId, sắp xếp thời gian giảm dần
    List<Comment> findByTargetIdOrderByCreatedAtDesc(String targetId);
    
    // Lấy các phản hồi của một comment cha
    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);
}