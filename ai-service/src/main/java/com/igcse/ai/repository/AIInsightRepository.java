package com.igcse.ai.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import com.igcse.ai.entity.AIInsight;

@Repository
public interface AIInsightRepository extends JpaRepository<AIInsight, Long> {
    Optional<AIInsight> findTopByStudentIdOrderByGeneratedAtDesc(Long studentId);

    List<AIInsight> findTop5ByStudentIdAndProgressIdIsNullOrderByGeneratedAtDesc(Long studentId);

    void deleteByStudentId(Long studentId);
}
