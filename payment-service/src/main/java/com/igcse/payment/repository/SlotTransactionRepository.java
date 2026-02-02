package com.igcse.payment.repository;

import com.igcse.payment.entity.SlotTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SlotTransactionRepository extends JpaRepository<SlotTransaction, Long> {

    /**
     * Tìm giao dịch theo giáo viên
     */
    List<SlotTransaction> findByTeacherId(Long teacherId);

    /**
     * Tìm giao dịch theo giáo viên với phân trang
     */
    Page<SlotTransaction> findByTeacherId(Long teacherId, Pageable pageable);

    /**
     * Tìm giao dịch theo trạng thái
     */
    List<SlotTransaction> findByPaymentStatus(String status);

    /**
     * Tìm giao dịch trong khoảng thời gian
     */
    List<SlotTransaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Tổng doanh thu từ bán suất học (đã hoàn thành)
     */
    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM SlotTransaction s WHERE s.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalRevenue();

    /**
     * Doanh thu theo khoảng thời gian
     */
    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM SlotTransaction s " +
            "WHERE s.paymentStatus = 'COMPLETED' " +
            "AND s.transactionDate BETWEEN :start AND :end")
    BigDecimal getRevenueByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Đếm số giao dịch theo trạng thái
     */
    long countByPaymentStatus(String status);
}
