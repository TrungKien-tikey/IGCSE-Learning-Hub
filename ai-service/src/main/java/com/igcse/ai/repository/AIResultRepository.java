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
 * Lớp AIResultRepository chịu trách nhiệm truy cập và lưu trữ dữ liệu kết quả chấm điểm
 */
@Repository
public interface AIResultRepository extends JpaRepository<AIResult, Long> {

    /**
     * Lấy kết quả theo bài làm
     * @param attemptId - Mã bài làm
     * @return AIResult - Kết quả chấm điểm
     */
    Optional<AIResult> findByAttemptId(Long attemptId);

    /**
     * Lấy tất cả kết quả theo studentId
     * @param studentId - Mã học sinh
     * @return List AIResult
     */
    List<AIResult> findByStudentId(Long studentId);

    /**
     * Lấy kết quả theo studentId và thời gian chấm sau ngày chỉ định
     * @param studentId - Mã học sinh
     * @param fromDate - Từ ngày
     * @return List AIResult
     */
    List<AIResult> findByStudentIdAndGradedAtAfter(Long studentId, Date fromDate);

    /**
     * Lấy tất cả kết quả theo examId
     * @param examId - Mã bài thi
     * @return List AIResult
     */
    List<AIResult> findByExamId(Long examId);

    /**
     * Lấy tất cả kết quả theo danh sách examId
     * @param examIds - Danh sách mã bài thi
     * @return List AIResult
     */
    List<AIResult> findByExamIdIn(List<Long> examIds);

    /**
     * Tính điểm trung bình theo studentId
     * @param studentId - Mã học sinh
     * @return Điểm trung bình
     */
    @Query("SELECT AVG(a.score) FROM AIResult a WHERE a.studentId = :studentId")
    Double getAverageScoreByStudentId(@Param("studentId") Long studentId);

    /**
     * Đếm số bài thi đã chấm theo studentId
     * @param studentId - Mã học sinh
     * @return Số lượng bài thi
     */
    long countByStudentId(Long studentId);

    /**
     * Đếm số bài thi đã chấm theo examId
     * @param examId - Mã bài thi
     * @return Số lượng bài thi
     */
    long countByExamId(Long examId);
}

