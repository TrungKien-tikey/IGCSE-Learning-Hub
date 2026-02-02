package com.igcse.user.service;

import com.igcse.user.entity.ParentStudentRelationship;
import com.igcse.user.entity.User;
import com.igcse.user.repository.ParentStudentRepository;
import com.igcse.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ParentStudentService {

    @Autowired
    private ParentStudentRepository relationshipRepository;

    @Autowired
    private UserRepository userRepository;

    public ParentStudentRelationship requestConnection(Long parentId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found with email: " + studentEmail));

        // Check if relationship already exists
        Optional<ParentStudentRelationship> existing = relationshipRepository.findByParentIdAndStudentId(parentId,
                student.getUserId());
        if (existing.isPresent()) {
            throw new RuntimeException("Relationship already exists");
        }

        ParentStudentRelationship relationship = new ParentStudentRelationship(parentId, student.getUserId());
        return relationshipRepository.save(relationship);
    }

    public ParentStudentRelationship acceptConnection(Long studentId, Long relationshipId) {
        ParentStudentRelationship relationship = relationshipRepository.findById(relationshipId)
                .orElseThrow(() -> new RuntimeException("Relationship not found"));

        if (!relationship.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized");
        }

        relationship.setStatus("ACCEPTED");
        return relationshipRepository.save(relationship);
    }

    public List<ParentStudentRelationship> getMyChildren(Long parentId) {
        return relationshipRepository.findByParentId(parentId);
    }

    public List<ParentStudentRelationship> getMyParents(Long studentId) {
        return relationshipRepository.findByStudentId(studentId);
    }
}
