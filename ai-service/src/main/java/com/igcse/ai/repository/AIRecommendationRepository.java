package com.igcse.ai.repository;

import com.igcse.ai.entity.AIRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, Long> {

    Optional<AIRecommendation> findTopByStudentIdOrderByGeneratedAtDesc(Long studentId);

    List<AIRecommendation> findTop5ByStudentIdAndProgressIdIsNullOrderByGeneratedAtDesc(Long studentId);

    void deleteByStudentId(Long studentId);
}