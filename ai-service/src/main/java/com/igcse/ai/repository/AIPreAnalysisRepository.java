package com.igcse.ai.repository;

import com.igcse.ai.entity.AIPreAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AIPreAnalysisRepository extends JpaRepository<AIPreAnalysis, Long> {
    Optional<AIPreAnalysis> findTopByStudentIdOrderByGeneratedAtDesc(Long studentId);
}
