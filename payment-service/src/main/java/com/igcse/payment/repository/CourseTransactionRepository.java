package com.igcse.payment.repository;

import com.igcse.payment.entity.CourseTransaction;
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
public interface CourseTransactionRepository extends JpaRepository<CourseTransaction, Long> {

    /**
     * Tìm giao dịch theo học sinh
     */
    List<CourseTransaction> findByStudentId(Long studentId);

    /**
     * Tìm giao dịch theo giáo viên (người bán)
     */
    List<CourseTransaction> findByTeacherId(Long teacherId);

    /**
     * Tìm giao dịch theo giáo viên với phân trang
     */
    Page<CourseTransaction> findByTeacherId(Long teacherId, Pageable pageable);

    /**
     * Tìm giao dịch theo khóa học
     */
    List<CourseTransaction> findByCourseId(Long courseId);

    /**
     * Tìm giao dịch theo trạng thái
     */
    List<CourseTransaction> findByPaymentStatus(String status);

    /**
     * Tìm giao dịch trong khoảng thời gian
     */
    List<CourseTransaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Tổng doanh thu từ bán khóa học (đã hoàn thành)
     */
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CourseTransaction c WHERE c.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalRevenue();

    /**
     * Tổng phí nền tảng (Admin thu)
     */
    @Query("SELECT COALESCE(SUM(c.platformFee), 0) FROM CourseTransaction c WHERE c.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalPlatformFee();

    /**
     * Tổng doanh thu giáo viên
     */
    @Query("SELECT COALESCE(SUM(c.teacherRevenue), 0) FROM CourseTransaction c WHERE c.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalTeacherRevenue();

    /**
     * Doanh thu của một giáo viên cụ thể
     */
    @Query("SELECT COALESCE(SUM(c.teacherRevenue), 0) FROM CourseTransaction c " +
            "WHERE c.teacherId = :teacherId AND c.paymentStatus = 'COMPLETED'")
    BigDecimal getTeacherRevenue(@Param("teacherId") Long teacherId);

    /**
     * Doanh thu theo khoảng thời gian
     */
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CourseTransaction c " +
            "WHERE c.paymentStatus = 'COMPLETED' " +
            "AND c.transactionDate BETWEEN :start AND :end")
    BigDecimal getRevenueByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Phí nền tảng theo khoảng thời gian
     */
    @Query("SELECT COALESCE(SUM(c.platformFee), 0) FROM CourseTransaction c " +
            "WHERE c.paymentStatus = 'COMPLETED' " +
            "AND c.transactionDate BETWEEN :start AND :end")
    BigDecimal getPlatformFeeByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Đếm số giao dịch hoàn thành
     */
    long countByPaymentStatus(String status);

    /**
     * Top giáo viên có doanh thu cao nhất
     */
    @Query("SELECT c.teacherId, c.teacherName, SUM(c.teacherRevenue) as revenue " +
            "FROM CourseTransaction c " +
            "WHERE c.paymentStatus = 'COMPLETED' " +
            "GROUP BY c.teacherId, c.teacherName " +
            "ORDER BY revenue DESC")
    List<Object[]> getTopTeachersByRevenue(Pageable pageable);
}
