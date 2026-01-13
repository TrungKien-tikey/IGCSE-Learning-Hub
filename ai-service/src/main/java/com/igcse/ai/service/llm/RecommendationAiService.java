package com.igcse.ai.service.llm;

import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

/**
 * Interface AI Service để tạo gợi ý học tập sử dụng LangChain4j.
 * Đã tối ưu: Loại bỏ studentName và persona để đơn giản hóa logic.
 */
public interface RecommendationAiService {

        @SystemMessage("""
                        You are an experienced IGCSE (Cambridge) educational consultant.
                        You specialize in analyzing IGCSE exam performance and designing targeted learning plans aligned with assessment objectives.

                        You must output a structured JSON object matching the LearningRecommendationDTO class:
                        - weakTopics: Specific IGCSE topics or question types where performance is below 50%.
                        - strongTopics: IGCSE topics or skills where performance is above 80%.
                        - recommendedResources: 3–5 concrete, IGCSE-appropriate resources.
                        - learningPathSuggestion: A clear 2–3 sentence plan.

                        IMPORTANT: You MUST provide the final report ONLY in the specified language: {{language}}.
                        Do NOT mix languages.
                        """)

        @UserMessage("""
                        Performance Data Summary: {{dataSummary}}
                        Language: {{language}}

                        Generate the personalized learning recommendation report now.
                        """)
        LearningRecommendationDTO generateRecommendation(
                        @V("dataSummary") String dataSummary,
                        @V("language") String language);
}
