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
        // Chỉ lấy những liên kết đang hoạt động (ACCEPTED hoặc PENDING), loại bỏ
        // CANCELLED
        return relationshipRepository.findByParentId(parentId).stream()
                .filter(rel -> !"CANCELLED".equals(rel.getStatus()))
                .toList();
    }

    public List<ParentStudentRelationship> getMyParents(Long studentId) {
        return relationshipRepository.findByStudentId(studentId).stream()
                .filter(rel -> !"CANCELLED".equals(rel.getStatus()))
                .toList();
    }

    public void disconnect(Long parentId, Long studentId) {
        ParentStudentRelationship rel = relationshipRepository.findByParentIdAndStudentId(parentId, studentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy liên kết này"));

        rel.setStatus("CANCELLED"); // Soft Delete
        relationshipRepository.save(rel);
    }

    public ParentStudentRelationship connectByLinkCode(Long parentId, String linkCode) {
        // 1. Tìm học sinh theo Link Code
        User student = userRepository.findByLinkCode(linkCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh với mã này"));

        // 2. Kiểm tra nếu học sinh này đã được liên kết với phụ huynh này chưa
        Optional<ParentStudentRelationship> existing = relationshipRepository.findByParentIdAndStudentId(parentId,
                student.getUserId());
        if (existing.isPresent()) {
            ParentStudentRelationship rel = existing.get();
            // Nếu đã có và đang ACCEPTED -> Trả về luôn (Coi như kết nối lại thành công)
            if ("ACCEPTED".equals(rel.getStatus())) {
                return rel;
            }
            // Nếu đã có nhưng chưa accept (PENDING/REJECTED) -> Update thành ACCEPTED luôn
            rel.setStatus("ACCEPTED");
            return relationshipRepository.save(rel);
        }

        // 3. Tạo mới liên kết với trạng thái ACCEPTED (vì có mã là tin cậy)
        ParentStudentRelationship relationship = new ParentStudentRelationship(parentId, student.getUserId());
        relationship.setStatus("ACCEPTED");
        return relationshipRepository.save(relationship);

    }

    public List<java.util.Map<String, Object>> getMyChildrenDetails(Long parentId) {
        List<ParentStudentRelationship> relationships = getMyChildren(parentId);

        if (relationships.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<Long> studentIds = relationships.stream()
                .map(ParentStudentRelationship::getStudentId)
                .toList();

        List<User> students = userRepository.findAllById(studentIds);

        // Map student by ID for easy lookup
        java.util.Map<Long, User> studentMap = students.stream()
                .collect(java.util.stream.Collectors.toMap(User::getUserId, user -> user));

        return relationships.stream().map(rel -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("relationship", rel);
            map.put("student", studentMap.get(rel.getStudentId()));
            return map;
        }).toList();
    }
}
