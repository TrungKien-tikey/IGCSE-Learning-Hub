package com.igcse.payment.repository;

import com.igcse.payment.entity.CourseSlotPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseSlotPackageRepository extends JpaRepository<CourseSlotPackage, Long> {

    /**
     * Tìm các gói đang hoạt động
     */
    List<CourseSlotPackage> findByIsActiveTrue();

    /**
     * Tìm các gói theo tên
     */
    List<CourseSlotPackage> findByNameContainingIgnoreCase(String name);
}
