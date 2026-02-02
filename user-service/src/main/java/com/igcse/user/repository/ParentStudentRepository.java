package com.igcse.user.repository;

import com.igcse.user.entity.ParentStudentRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParentStudentRepository extends JpaRepository<ParentStudentRelationship, Long> {
    List<ParentStudentRelationship> findByParentId(Long parentId);

    List<ParentStudentRelationship> findByStudentId(Long studentId);

    Optional<ParentStudentRelationship> findByParentIdAndStudentId(Long parentId, Long studentId);
}
