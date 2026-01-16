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

                    // Trích xuất các thông tin Metadata khác
                    String studentName = extractString(record, "student_name", "name", "full_name");
                    Long classId = extractLong(record, "class_id");

                    // Lưu trữ toàn bộ record dưới dạng JSON để AI có thể đọc mọi thông tin phụ trợ
                    String fullContextJson = jsonService.toJson(record);

                    // Cập nhật hoặc thêm mới (Upsert)
                    StudyContext context = studyContextRepository.findByStudentId(studentId)
                            .orElse(new StudyContext());

                    context.setStudentId(studentId);
                    if (studentName != null)
                        context.setStudentName(studentName);
                    if (classId != null)
                        context.setClassId(classId);
                    context.setContextData(fullContextJson);
                    context.setUpdatedAt(new Date());

                    studyContextRepository.save(context);
                    logger.debug("Successfully persisted StudyContext for studentId: {}", studentId);
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

    private Long extractLong(Map<String, Object> record, String key) {
        if (record.containsKey(key) && record.get(key) != null) {
            try {
                return Long.valueOf(record.get(key).toString());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
