package com.igcse.payment.service;

import com.igcse.payment.dto.*;
import com.igcse.payment.entity.*;
import com.igcse.payment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service thống kê doanh thu cho Admin
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final TransactionRepository transactionRepository;
    private final SlotTransactionRepository slotTransactionRepository;
    private final CourseTransactionRepository courseTransactionRepository;
    private final TeacherSlotRepository teacherSlotRepository;

    // ==================== REVENUE OVERVIEW ====================

    /**
     * Lấy tổng quan doanh thu cho Admin Dashboard
     */
    public RevenueOverviewDTO getRevenueOverview() {
        log.info("Getting revenue overview for admin dashboard");

        // Tổng doanh thu từ bán suất học
        BigDecimal slotRevenue = slotTransactionRepository.getTotalRevenue();

        // Tổng doanh thu từ bán khóa học
        BigDecimal courseRevenue = courseTransactionRepository.getTotalRevenue();

        // Tổng phí nền tảng từ khóa học
        BigDecimal coursePlatformFee = courseTransactionRepository.getTotalPlatformFee();

        // Tổng doanh thu hệ thống
        BigDecimal totalRevenue = slotRevenue.add(courseRevenue);

        // Tổng doanh thu Admin = 100% suất học + phí nền tảng từ khóa học
        BigDecimal platformRevenue = slotRevenue.add(coursePlatformFee);

        // Đếm giao dịch
        long totalTransactions = transactionRepository.count();
        long completedTransactions = transactionRepository.countByPaymentStatus("COMPLETED");
        long pendingTransactions = transactionRepository.countByPaymentStatus("PENDING");

        // Doanh thu theo loại
        Map<String, BigDecimal> revenueByType = new HashMap<>();
        revenueByType.put("SLOT_PURCHASE", slotRevenue);
        revenueByType.put("COURSE_ENROLLMENT", courseRevenue);

        return RevenueOverviewDTO.builder()
                .totalRevenue(totalRevenue)
                .totalPlatformRevenue(platformRevenue)
                .slotPurchaseRevenue(slotRevenue)
                .courseEnrollmentRevenue(courseRevenue)
                .coursePlatformFee(coursePlatformFee)
                .totalTransactions(totalTransactions)
                .completedTransactions(completedTransactions)
                .pendingTransactions(pendingTransactions)
                .revenueByType(revenueByType)
                .build();
    }

    // ==================== MONTHLY REVENUE ====================

    /**
     * Lấy doanh thu theo tháng trong năm
     */
    public List<MonthlyRevenueDTO> getMonthlyRevenue(int year) {
        log.info("Getting monthly revenue for year: {}", year);

        List<Object[]> monthlyData = transactionRepository.getMonthlyRevenue(year);
        List<Object[]> platformData = transactionRepository.getMonthlyPlatformRevenue(year);

        // Tạo map để lookup platform revenue
        Map<Integer, BigDecimal> platformMap = new HashMap<>();
        for (Object[] row : platformData) {
            Integer month = ((Number) row[0]).intValue();
            BigDecimal revenue = (BigDecimal) row[1];
            platformMap.put(month, revenue);
        }

        // Build result với tất cả 12 tháng
        List<MonthlyRevenueDTO> result = new ArrayList<>();
        Map<Integer, BigDecimal> revenueMap = new HashMap<>();

        for (Object[] row : monthlyData) {
            Integer month = ((Number) row[0]).intValue();
            BigDecimal revenue = (BigDecimal) row[1];
            revenueMap.put(month, revenue);
        }

        // Fill tất cả 12 tháng
        for (int month = 1; month <= 12; month++) {
            BigDecimal totalRevenue = revenueMap.getOrDefault(month, BigDecimal.ZERO);
            BigDecimal platformRevenue = platformMap.getOrDefault(month, BigDecimal.ZERO);

            result.add(MonthlyRevenueDTO.builder()
                    .month(month)
                    .monthName("Tháng " + month)
                    .totalRevenue(totalRevenue)
                    .platformRevenue(platformRevenue)
                    .build());
        }

        return result;
    }

    /**
     * Lấy doanh thu theo ngày trong tháng
     */
    public List<Map<String, Object>> getDailyRevenue(int year, int month) {
        log.info("Getting daily revenue for {}/{}", month, year);

        List<Object[]> dailyData = transactionRepository.getDailyRevenue(year, month);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : dailyData) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("day", ((Number) row[0]).intValue());
            dayData.put("revenue", row[1]);
            result.add(dayData);
        }

        return result;
    }

    // ==================== DATE RANGE REVENUE ====================

    /**
     * Lấy doanh thu theo khoảng thời gian
     */
    public Map<String, BigDecimal> getRevenueByDateRange(LocalDateTime start, LocalDateTime end) {
        log.info("Getting revenue from {} to {}", start, end);

        BigDecimal totalRevenue = transactionRepository.getRevenueByDateRange(start, end);
        BigDecimal platformRevenue = transactionRepository.getPlatformRevenueByDateRange(start, end);

        BigDecimal slotRevenue = slotTransactionRepository.getRevenueByDateRange(start, end);
        BigDecimal courseRevenue = courseTransactionRepository.getRevenueByDateRange(start, end);

        Map<String, BigDecimal> result = new HashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("platformRevenue", platformRevenue);
        result.put("slotPurchaseRevenue", slotRevenue);
        result.put("courseEnrollmentRevenue", courseRevenue);

        return result;
    }

    // ==================== TRANSACTION HISTORY ====================

    /**
     * Lấy lịch sử giao dịch với phân trang
     */
    public Page<TransactionDTO> getTransactionHistory(
            String type,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        log.info("Getting transaction history - type: {}, status: {}, from: {}, to: {}",
                type, status, startDate, endDate);

        Page<Transaction> transactions;

        if (type != null && !type.isEmpty() && startDate != null && endDate != null) {
            transactions = transactionRepository.findByTransactionTypeAndTransactionDateBetween(
                    type, startDate, endDate, pageable);
        } else if (startDate != null && endDate != null) {
            transactions = transactionRepository.findByTransactionDateBetween(startDate, endDate, pageable);
        } else if (type != null && !type.isEmpty()) {
            transactions = transactionRepository.findByTransactionType(type, pageable);
        } else if (status != null && !status.isEmpty()) {
            transactions = transactionRepository.findByPaymentStatus(status, pageable);
        } else {
            transactions = transactionRepository.findAll(pageable);
        }

        return transactions.map(this::convertToDTO);
    }

    /**
     * Convert Transaction entity to DTO
     */
    private TransactionDTO convertToDTO(Transaction t) {
        return TransactionDTO.builder()
                .id(t.getId())
                .transactionType(t.getTransactionType())
                .referenceId(t.getReferenceId())
                .buyerId(t.getBuyerId())
                .buyerName(t.getBuyerName())
                .buyerRole(t.getBuyerRole())
                .sellerId(t.getSellerId())
                .sellerName(t.getSellerName())
                .amount(t.getAmount())
                .platformRevenue(t.getPlatformRevenue())
                .paymentMethod(t.getPaymentMethod())
                .paymentStatus(t.getPaymentStatus())
                .transactionDate(t.getTransactionDate())
                .completedAt(t.getCompletedAt())
                .description(t.getDescription())
                .build();
    }

    // ==================== TOP TEACHERS ====================

    /**
     * Lấy top giáo viên có doanh thu cao nhất
     */
    public List<TeacherRevenueDTO> getTopTeachers(int limit) {
        log.info("Getting top {} teachers by revenue", limit);

        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> topTeachers = courseTransactionRepository.getTopTeachersByRevenue(pageable);

        List<TeacherRevenueDTO> result = new ArrayList<>();
        int rank = 1;

        for (Object[] row : topTeachers) {
            Long teacherId = ((Number) row[0]).longValue();
            String teacherName = (String) row[1];
            BigDecimal revenue = (BigDecimal) row[2];

            result.add(TeacherRevenueDTO.builder()
                    .teacherId(teacherId)
                    .teacherName(teacherName != null ? teacherName : "Giáo viên #" + teacherId)
                    .totalRevenue(revenue)
                    .rank(rank++)
                    .build());
        }

        return result;
    }

    // ==================== SLOT STATISTICS ====================

    /**
     * Thống kê suất học
     */
    public Map<String, Object> getSlotStatistics() {
        log.info("Getting slot statistics");

        Integer totalSold = teacherSlotRepository.getTotalSlotsSold();
        Integer totalUsed = teacherSlotRepository.getTotalSlotsUsed();
        long totalTeachers = teacherSlotRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSlotsSold", totalSold != null ? totalSold : 0);
        stats.put("totalSlotsUsed", totalUsed != null ? totalUsed : 0);
        stats.put("totalSlotsAvailable", (totalSold != null ? totalSold : 0) - (totalUsed != null ? totalUsed : 0));
        stats.put("totalTeachersWithSlots", totalTeachers);

        return stats;
    }
}
