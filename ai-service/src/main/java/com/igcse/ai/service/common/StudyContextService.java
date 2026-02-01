package com.igcse.ai.service.common;

import com.igcse.ai.entity.StudyContext;
import com.igcse.ai.repository.StudyContextRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service xử lý logic lưu trữ và truy xuất bối cảnh học tập (Study Context).
 * Đảm bảo dữ liệu từ NiFi được lưu vào Database trước khi AI phân tích.
 */
@Service
@RequiredArgsConstructor
public class StudyContextService {
    private static final Logger logger = LoggerFactory.getLogger(StudyContextService.class);

    private final StudyContextRepository studyContextRepository;
    private final JsonService jsonService;

    /**
     * Lưu hoặc cập nhật bối cảnh học tập từ danh sách các bản ghi nhận được từ
     * NiFi.
     * 
     * @param records Danh sách dữ liệu từ NiFi
     */
    @Transactional
    public void saveContextFromNiFi(List<Map<String, Object>> records) {
        if (records == null || records.isEmpty())
            return;

        for (Map<String, Object> record : records) {
            try {
                // Trích xuất Student ID
                Object sid = record.get("user_id");
                if (sid == null)
                    sid = record.get("studentId");

                if (sid != null) {
                    Long studentId = Long.valueOf(sid.toString());

                    // Trích xuất các thông tin Metadata khác (dùng full_name và course_id)
                    String studentName = extractString(record, "full_name", "student_name", "name","studentName","fullName");
                    Long courseId = extractLong(record, "course_id", "class_id");
                    String courseTitle = extractString(record, "title", "course_title", "courseName");
                    String persona = extractString(record, "persona", "habits", "behavior");

                    // Nếu chưa có persona, tự động tính từ duration và score
                    if (persona == null || persona.isEmpty()) {
                        persona = calculatePersona(record);
                    }

                    // Lưu trữ toàn bộ record dưới dạng JSON để AI có thể đọc mọi thông tin phụ trợ
                    String fullContextJson = jsonService.toJson(record);

                    // Cập nhật hoặc thêm mới (Upsert)
                    StudyContext context = studyContextRepository.findByStudentId(studentId)
                            .orElse(new StudyContext());

                    context.setStudentId(studentId);
                    if (studentName != null)
                        context.setStudentName(studentName);
                    if (courseId != null)
                        context.setClassId(courseId);
                    if (courseTitle != null)
                        context.setCourseTitle(courseTitle);

                    if (persona != null)
                        context.setPersona(persona);

                    context.setContextData(fullContextJson);
                    context.setUpdatedAt(new Date());

                    studyContextRepository.save(context);
                    logger.debug(
                            "Successfully persisted StudyContext for studentId: {} with courseTitle: {} persona: {}",
                            studentId, courseTitle, persona);

                }

            } catch (Exception e) {
                logger.error("Error persisting StudyContext from NiFi record: {}", e.getMessage());
            }
        }
    }

    /**
     * Lấy bối cảnh học tập gần nhất của học sinh.
     */
    public Optional<StudyContext> getContext(Long studentId) {
        return studyContextRepository.findByStudentId(studentId);
    }

    // --- Helper Methods ---

    private String extractString(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            if (record.containsKey(key) && record.get(key) != null) {
                return record.get(key).toString();
            }
        }
        return null;
    }

    private Long extractLong(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            if (record.containsKey(key) && record.get(key) != null) {
                try {
                    return Long.valueOf(record.get(key).toString());
                } catch (NumberFormatException e) {
                    // Continue to next key
                }
            }
        }
        return null;
    }

    /**
     * Tính toán persona dựa trên thời gian làm bài và điểm số.
     * Logic:
     * - duration < 120s (2 phút): "Học nhanh, thông minh"
     * - duration > 600s (10 phút): "Siêu cẩn thận, tỉ mỉ"
     * - score >= 80% total_score: "Phong độ xuất sắc"
     * - Mặc định: "Chăm chỉ, bình tĩnh"
     */
    private String calculatePersona(Map<String, Object> record) {
        try {
            // Tính duration từ start_time và submitted_at
            Object startTime = record.get("start_time");
            Object submittedAt = record.get("submitted_at");

            Long durationSeconds = null;
            if (startTime != null && submittedAt != null) {
                // Parse timestamps - hỗ trợ nhiều format
                long start = parseTimestamp(startTime);
                long end = parseTimestamp(submittedAt);
                if (start > 0 && end > 0) {
                    durationSeconds = (end - start) / 1000; // Convert ms to seconds
                }
            }

            // Tính điểm phần trăm
            Double scorePercent = null;
            Object totalScore = record.get("total_score");
            Object currentScore = record.get("current_score");
            if (currentScore == null)
                currentScore = record.get("score");

            if (totalScore != null && currentScore != null) {
                double total = Double.parseDouble(totalScore.toString());
                double current = Double.parseDouble(currentScore.toString());
                if (total > 0) {
                    scorePercent = current / total;
                }
            }

            // Xác định persona
            if (durationSeconds != null && durationSeconds < 120) {
                return "Học nhanh, thông minh";
            }
            if (durationSeconds != null && durationSeconds > 600) {
                return "Siêu cẩn thận, tỉ mỉ";
            }
            if (scorePercent != null && scorePercent >= 0.8) {
                return "Phong độ xuất sắc";
            }
            return "Chăm chỉ, bình tĩnh";

        } catch (Exception e) {
            logger.warn("Error calculating persona: {}", e.getMessage());
            return "Chăm chỉ, bình tĩnh"; // Default
        }
    }

    /**
     * Parse timestamp từ nhiều format khác nhau.
     */
    private long parseTimestamp(Object value) {
        if (value == null)
            return 0;
        try {
            String str = value.toString();
            // Nếu là số (epoch millis)
            if (str.matches("\\d+")) {
                return Long.parseLong(str);
            }
            // Nếu là ISO format hoặc datetime string
            java.time.Instant instant = java.time.Instant.parse(str);
            return instant.toEpochMilli();
        } catch (Exception e) {
            try {
                // Thử parse với format MySQL datetime
                java.time.LocalDateTime ldt = java.time.LocalDateTime.parse(
                        value.toString().replace(" ", "T"));
                return ldt.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
            } catch (Exception e2) {
                return 0;
            }
        }
    }

}
