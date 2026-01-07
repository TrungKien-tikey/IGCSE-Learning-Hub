package com.igcse.ai.service.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.igcse.ai.dto.aiChamDiem.GradingResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service dùng chung để xử lý các thao tác liên quan đến JSON
 */
@Service
@RequiredArgsConstructor
public class JsonService {

    private static final Logger logger = LoggerFactory.getLogger(JsonService.class);
    private final ObjectMapper objectMapper;

    /**
     * Parse chuỗi JSON details thành danh sách kết quả chấm điểm
     * 
     * @param detailsJson Chuỗi JSON chứa danh sách GradingResult
     * @return List<GradingResult>, trả về danh sách rỗng nếu input null/empty hoặc
     *         parse lỗi
     */
    public List<GradingResult> parseGradingDetails(String detailsJson) {
        if (detailsJson == null || detailsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(
                    detailsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, GradingResult.class));
        } catch (JsonProcessingException e) {
            logger.error("Lỗi khi parse JSON grading details: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Chuyển đổi object sang chuỗi JSON
     */
    public String toJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            logger.error("Lỗi khi convert object sang JSON: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Lấy ObjectMapper để sử dụng trong các service khác
     */
    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}
