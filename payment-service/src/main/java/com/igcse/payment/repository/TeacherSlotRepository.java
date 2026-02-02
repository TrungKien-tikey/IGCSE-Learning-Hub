package com.igcse.payment.repository;

import com.igcse.payment.entity.TeacherSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherSlotRepository extends JpaRepository<TeacherSlot, Long> {

    /**
     * Tìm theo ID giáo viên
     */
    Optional<TeacherSlot> findByTeacherId(Long teacherId);

    /**
     * Kiểm tra giáo viên đã có record chưa
     */
    boolean existsByTeacherId(Long teacherId);

    /**
     * Tìm giáo viên còn suất học
     */
    List<TeacherSlot> findByAvailableSlotsGreaterThan(Integer minSlots);

    /**
     * Tổng số suất đã bán
     */
    @Query("SELECT COALESCE(SUM(t.totalSlots), 0) FROM TeacherSlot t")
    Integer getTotalSlotsSold();

    /**
     * Tổng số suất đã sử dụng
     */
    @Query("SELECT COALESCE(SUM(t.usedSlots), 0) FROM TeacherSlot t")
    Integer getTotalSlotsUsed();
}
