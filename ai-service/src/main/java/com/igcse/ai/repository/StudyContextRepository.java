package com.igcse.ai.repository;

import com.igcse.ai.entity.StudyContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository quản lý dữ liệu bối cảnh học tập.
 */
@Repository
public interface StudyContextRepository extends JpaRepository<StudyContext, Long> {

    /**
     * Tìm bối cảnh học tập theo Student ID.
     */
    Optional<StudyContext> findByStudentId(Long studentId);
}
