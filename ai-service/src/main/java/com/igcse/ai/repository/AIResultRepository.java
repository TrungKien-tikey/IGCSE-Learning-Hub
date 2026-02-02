package com.igcse.ai.repository;

import com.igcse.ai.entity.AIResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * Lớp AIResultRepository chịu trách nhiệm truy cập và lưu trữ dữ liệu kết quả
 * chấm điểm
 */
@Repository
public interface AIResultRepository extends JpaRepository<AIResult, Long> {

    /**
     * Lấy kết quả theo bài làm
     * 
     * @param attemptId - Mã bài làm
     * @return AIResult - Kết quả chấm điểm
     */
    Optional<AIResult> findByAttemptId(Long attemptId);

    /**
     * Lấy tất cả kết quả theo studentId
     * 
     * @param studentId - Mã học sinh
     * @return List AIResult
     */
    List<AIResult> findByStudentId(Long studentId);

    /**
     * Lấy kết quả theo studentId và thời gian chấm sau ngày chỉ định
     * 
     * @param studentId - Mã học sinh
     * @param fromDate  - Từ ngày
     * @return List AIResult
     */
    List<AIResult> findByStudentIdAndGradedAtAfter(Long studentId, Date fromDate);

    /**
     * Lấy tất cả kết quả theo classId
     * 
     * @param classId - Mã lớp học
     * @return List AIResult
     */
    List<AIResult> findByClassId(Long classId);

    /**
     * Đếm số học sinh unique trong một lớp
     */
    @Query("SELECT COUNT(DISTINCT r.studentId) FROM AIResult r WHERE r.classId = :classId")
    Long countDistinctStudentsByClassId(@Param("classId") Long classId);

    /**
     * Tính điểm trung bình của lớp
     */
    @Query("SELECT AVG(r.score) FROM AIResult r WHERE r.classId = :classId")
    Double getAverageScoreByClassId(@Param("classId") Long classId);

    /**
     * Đếm số bài thi đã chấm của lớp
     */
    @Query("SELECT COUNT(r) FROM AIResult r WHERE r.classId = :classId")
    Long countByClassId(@Param("classId") Long classId);

    /**
     * Tính confidence trung bình của toàn hệ thống
     */
    @Query("SELECT AVG(r.confidence) FROM AIResult r WHERE r.confidence IS NOT NULL")
    Double getAverageConfidence();

    // --------- Aggregation cho thống kê theo student ---------

    @Query("SELECT COUNT(r) FROM AIResult r WHERE r.studentId = :studentId")
    Long countByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT AVG(r.score) FROM AIResult r WHERE r.studentId = :studentId")
    Double getAverageScoreByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT MAX(r.score) FROM AIResult r WHERE r.studentId = :studentId")
    Double getMaxScoreByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT MIN(r.score) FROM AIResult r WHERE r.studentId = :studentId")
    Double getMinScoreByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT AVG(r.score) FROM AIResult r WHERE r.studentId = :studentId AND r.gradedAt BETWEEN :startDate AND :endDate")
    Double getAverageScoreByStudentIdAndDateRange(@Param("studentId") Long studentId,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate);

    // --------- Aggregation cho thống kê theo Exam + Class ---------

    @Query("SELECT COUNT(r) FROM AIResult r WHERE r.examId = :examId AND r.classId = :classId")
    Long countByExamIdAndClassId(@Param("examId") Long examId, @Param("classId") Long classId);

    @Query("SELECT AVG(r.score) FROM AIResult r WHERE r.examId = :examId AND r.classId = :classId")
    Double getAverageScoreByExamIdAndClassId(@Param("examId") Long examId, @Param("classId") Long classId);

    List<AIResult> findByExamIdAndClassId(Long examId, Long classId);

    @Query("SELECT DISTINCT r.examId FROM AIResult r WHERE r.classId = :classId")
    List<Long> findExamIdsByClassId(@Param("classId") Long classId);

    // --------- Aggregation cho thống kê theo Exam (Class-agnostic) ---------

    @Query("SELECT COUNT(r) FROM AIResult r WHERE r.examId = :examId")
    Long countByExamId(@Param("examId") Long examId);

    @Query("SELECT AVG(r.score) FROM AIResult r WHERE r.examId = :examId")
    Double getAverageScoreByExamId(@Param("examId") Long examId);

    List<AIResult> findByExamId(Long examId);
}
