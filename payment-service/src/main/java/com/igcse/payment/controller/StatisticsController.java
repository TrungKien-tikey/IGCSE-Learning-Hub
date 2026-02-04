package com.igcse.payment.controller;

import com.igcse.payment.dto.*;
import com.igcse.payment.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controller thống kê doanh thu cho Admin Dashboard
 */
@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Statistics", description = "API thống kê doanh thu cho quản trị viên")
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final StatisticsService statisticsService;

    // ==================== REVENUE OVERVIEW ====================

    @GetMapping("/revenue/overview")
    @Operation(summary = "Tổng quan doanh thu", description = "Lấy tổng quan doanh thu cho Admin Dashboard")
    public ResponseEntity<RevenueOverviewDTO> getRevenueOverview() {
        log.info("API: Get revenue overview");
        RevenueOverviewDTO overview = statisticsService.getRevenueOverview();
        return ResponseEntity.ok(overview);
    }

    // ==================== MONTHLY REVENUE ====================

    @GetMapping("/revenue/monthly")
    @Operation(summary = "Doanh thu theo tháng", description = "Lấy doanh thu theo tháng trong năm")
    public ResponseEntity<List<MonthlyRevenueDTO>> getMonthlyRevenue(
            @RequestParam(defaultValue = "2026") int year) {
        log.info("API: Get monthly revenue for year {}", year);
        List<MonthlyRevenueDTO> monthlyRevenue = statisticsService.getMonthlyRevenue(year);
        return ResponseEntity.ok(monthlyRevenue);
    }

    @GetMapping("/revenue/daily")
    @Operation(summary = "Doanh thu theo ngày", description = "Lấy doanh thu theo ngày trong tháng")
    public ResponseEntity<List<Map<String, Object>>> getDailyRevenue(
            @RequestParam int year,
            @RequestParam int month) {
        log.info("API: Get daily revenue for {}/{}", month, year);
        List<Map<String, Object>> dailyRevenue = statisticsService.getDailyRevenue(year, month);
        return ResponseEntity.ok(dailyRevenue);
    }

    // ==================== DATE RANGE REVENUE ====================

    @GetMapping("/revenue/date-range")
    @Operation(summary = "Doanh thu theo khoảng thời gian", description = "Lấy doanh thu trong khoảng thời gian chỉ định - trả về danh sách theo ngày")
    public ResponseEntity<List<Map<String, Object>>> getRevenueByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String end) {
        log.info("API: Get revenue from {} to {}", start, end);
        LocalDateTime startDt = LocalDateTime.parse(start + "T00:00:00");
        LocalDateTime endDt = LocalDateTime.parse(end + "T23:59:59");
        List<Map<String, Object>> revenue = statisticsService.getRevenueByDateRange(startDt, endDt);
        return ResponseEntity.ok(revenue);
    }

    // ==================== TRANSACTION HISTORY ====================

    @GetMapping("/transactions")
    @Operation(summary = "Lịch sử giao dịch", description = "Lấy lịch sử giao dịch với phân trang và bộ lọc")
    public ResponseEntity<Page<TransactionDTO>> getTransactionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("API: Get transaction history - page: {}, size: {}, type: {}, status: {}",
                page, size, type, status);

        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<TransactionDTO> transactions = statisticsService.getTransactionHistory(
                type, status, startDate, endDate, pageable);
        return ResponseEntity.ok(transactions);
    }

    // ==================== TOP TEACHERS ====================

    @GetMapping("/top-teachers")
    @Operation(summary = "Top giáo viên", description = "Lấy danh sách giáo viên có doanh thu cao nhất")
    public ResponseEntity<List<TeacherRevenueDTO>> getTopTeachers(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("API: Get top {} teachers by revenue", limit);
        List<TeacherRevenueDTO> topTeachers = statisticsService.getTopTeachers(limit);
        return ResponseEntity.ok(topTeachers);
    }

    // ==================== SLOT STATISTICS ====================

    @GetMapping("/slots")
    @Operation(summary = "Thống kê suất học", description = "Lấy thống kê về suất học đã bán")
    public ResponseEntity<Map<String, Object>> getSlotStatistics() {
        log.info("API: Get slot statistics");
        Map<String, Object> stats = statisticsService.getSlotStatistics();
        return ResponseEntity.ok(stats);
    }
}
