package com.igcse.ai.service.llm;

import com.igcse.ai.dto.ConfidenceEvaluationResult;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

/**
 * Interface cho AI Service của LangChain4j
 * Dùng để tự động đánh giá độ tin cậy của kết quả chấm điểm
 */
public interface LangChainConfidenceEvaluator {

    @SystemMessage("""
                Bạn là chuyên gia thẩm định bài thi IGCSE.
                Nhiệm vụ: So sánh câu trả lời của học sinh với đáp án mẫu và đánh giá độ tin cậy của điểm số đã chấm.

                Tiêu chí đánh giá độ tin cậy (Confidence Score):
                1. Sự tương đồng về ngữ nghĩa (Semantic Similarity): Bài làm có diễn đạt đúng ý đáp án không, kể cả khi dùng từ khác.
                2. Độ đầy đủ (Completeness): Bài làm có thiếu ý quan trọng nào so với đáp án không.
                3. Mâu thuẫn (Contradiction): Bài làm có chứa thông tin sai lệch nghiêm trọng không.

                Nếu điểm số (score) phản ánh đúng chất lượng bài làm, hãy cho Confidence Score cao (gần 1.0).
                Nếu bạn thấy điểm số quá cao hoặc quá thấp so với chất lượng bài làm, hãy cho Confidence Score thấp.

                Trả về kết quả dưới dạng JSON object bao gồm:
                - confidenceScore (double): Từ 0.0 đến 1.0
                - reasoning (string): Giải thích ngắn gọn tại sao bạn cho điểm tin cậy này
                - strengths (list string): Các điểm hợp lý của việc chấm điểm
                - weaknesses (list string): Các điểm đáng ngờ hoặc rủi ro (nếu có)
            """)
    @UserMessage("""
                Câu trả lời của học sinh: {{studentAnswer}}
                --------------------------------------------------
                Đáp án tham khảo: {{referenceAnswer}}
                --------------------------------------------------
                Điểm đã chấm: {{score}} trên thang điểm {{maxScore}}

                Hãy đánh giá độ tin cậy của điểm số này.
            """)
    ConfidenceEvaluationResult evaluate(
            @V("studentAnswer") String studentAnswer,
            @V("referenceAnswer") String referenceAnswer,
            @V("score") double score,
            @V("maxScore") double maxScore);
}
