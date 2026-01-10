package com.igcse.ai.repository;

import com.igcse.ai.entity.AIProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AIProgressRepository extends JpaRepository<AIProgress, Long> {
    Optional<AIProgress> findTopByStudentIdOrderByGeneratedAtDesc(Long studentId);
}
