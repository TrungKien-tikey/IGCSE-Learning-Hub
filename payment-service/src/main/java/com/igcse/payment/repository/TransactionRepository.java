package com.igcse.payment.repository;

import com.igcse.payment.entity.Transaction;
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
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // ==================== BASIC QUERIES ====================

    /**
     * Tìm theo loại giao dịch
     */
    List<Transaction> findByTransactionType(String type);

    /**
     * Tìm theo loại giao dịch với phân trang
     */
    Page<Transaction> findByTransactionType(String type, Pageable pageable);

    /**
     * Tìm theo người mua
     */
    List<Transaction> findByBuyerId(Long buyerId);

    /**
     * Tìm theo người bán
     */
    List<Transaction> findBySellerId(Long sellerId);

    /**
     * Tìm theo trạng thái
     */
    Page<Transaction> findByPaymentStatus(String status, Pageable pageable);

    /**
     * Tìm theo khoảng thời gian
     */
    Page<Transaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * Tìm theo loại và khoảng thời gian
     */
    Page<Transaction> findByTransactionTypeAndTransactionDateBetween(
            String type, LocalDateTime start, LocalDateTime end, Pageable pageable);

    // ==================== REVENUE STATISTICS ====================

    /**
     * Tổng doanh thu hệ thống (tất cả giao dịch hoàn thành)
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalRevenue();

    /**
     * Tổng doanh thu Admin (platform revenue)
     */
    @Query("SELECT COALESCE(SUM(t.platformRevenue), 0) FROM Transaction t WHERE t.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalPlatformRevenue();

    /**
     * Doanh thu theo loại giao dịch
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.transactionType = :type AND t.paymentStatus = 'COMPLETED'")
    BigDecimal getRevenueByType(@Param("type") String type);

    /**
     * Doanh thu Admin theo loại giao dịch
     */
    @Query("SELECT COALESCE(SUM(t.platformRevenue), 0) FROM Transaction t " +
            "WHERE t.transactionType = :type AND t.paymentStatus = 'COMPLETED'")
    BigDecimal getPlatformRevenueByType(@Param("type") String type);

    /**
     * Doanh thu theo khoảng thời gian
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.paymentStatus = 'COMPLETED' " +
            "AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal getRevenueByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Doanh thu Admin theo khoảng thời gian
     */
    @Query("SELECT COALESCE(SUM(t.platformRevenue), 0) FROM Transaction t " +
            "WHERE t.paymentStatus = 'COMPLETED' " +
            "AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal getPlatformRevenueByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // ==================== MONTHLY STATISTICS ====================

    /**
     * Doanh thu theo tháng trong năm
     */
    @Query("SELECT MONTH(t.transactionDate) as month, COALESCE(SUM(t.amount), 0) as revenue " +
            "FROM Transaction t " +
            "WHERE YEAR(t.transactionDate) = :year AND t.paymentStatus = 'COMPLETED' " +
            "GROUP BY MONTH(t.transactionDate) " +
            "ORDER BY month")
    List<Object[]> getMonthlyRevenue(@Param("year") int year);

    /**
     * Doanh thu Admin theo tháng trong năm
     */
    @Query("SELECT MONTH(t.transactionDate) as month, COALESCE(SUM(t.platformRevenue), 0) as revenue " +
            "FROM Transaction t " +
            "WHERE YEAR(t.transactionDate) = :year AND t.paymentStatus = 'COMPLETED' " +
            "GROUP BY MONTH(t.transactionDate) " +
            "ORDER BY month")
    List<Object[]> getMonthlyPlatformRevenue(@Param("year") int year);

    /**
     * Doanh thu theo ngày trong tháng
     */
    @Query("SELECT DAY(t.transactionDate) as day, COALESCE(SUM(t.amount), 0) as revenue " +
            "FROM Transaction t " +
            "WHERE YEAR(t.transactionDate) = :year " +
            "AND MONTH(t.transactionDate) = :month " +
            "AND t.paymentStatus = 'COMPLETED' " +
            "GROUP BY DAY(t.transactionDate) " +
            "ORDER BY day")
    List<Object[]> getDailyRevenue(@Param("year") int year, @Param("month") int month);

    // ==================== COUNT STATISTICS ====================

    /**
     * Đếm tổng số giao dịch
     */
    long countByPaymentStatus(String status);

    /**
     * Đếm giao dịch theo loại
     */
    long countByTransactionTypeAndPaymentStatus(String type, String status);

    /**
     * Đếm giao dịch trong khoảng thời gian
     */
    @Query("SELECT COUNT(t) FROM Transaction t " +
            "WHERE t.transactionDate BETWEEN :start AND :end")
    long countByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
