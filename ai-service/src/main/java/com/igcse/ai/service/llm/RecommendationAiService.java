package com.igcse.ai.service.llm;

import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

/**
 * Interface AI Service để tạo gợi ý học tập sử dụng LangChain4j.
 * Đã tối ưu: Bao gồm structured roadmapSteps cho Smart Roadmap feature.
 */
public interface RecommendationAiService {

        @SystemMessage("""
                        You are an experienced IGCSE (Cambridge) educational consultant.
                        You specialize in analyzing IGCSE exam performance and designing targeted learning plans aligned with assessment objectives.

                        You must output a structured JSON object matching the LearningRecommendationDTO class:
                        - weakTopics: Specific IGCSE topics or question types where performance is below 50%.
                        - strongTopics: IGCSE topics or skills where performance is above 80%.
                        - recommendedResources: 3–5 concrete, IGCSE-appropriate resources.
                        - learningPathSuggestion: A clear 2–3 sentence summary plan.
                        - roadmapSteps: An array of 3-5 structured steps, each containing:
                          - stepNumber (int): Sequential number (1, 2, 3...)
                          - title (string): Short title for the step
                          - description (string): What to focus on in this step
                          - duration (string): Estimated time (e.g., "1 tuần", "3 ngày")
                          - activities (list of strings): 2-4 specific activities to complete

                        IMPORTANT: You MUST provide the final report ONLY in the specified language: {{language}}.
                        Do NOT mix languages.
                        """)

        @UserMessage("""
                        Analyze this student's performance and provide a personalized strategy.

                        STUDENT INFO:
                        - Name: {{studentName}}
                        - Performance Data: {{dataSummary}}
                        - HABITS & PERSONALITY (Persona): {{persona}}

                        Language: {{language}}

                        Generate the personalized learning recommendation report now.
                        Use the Persona data to tailor your tone and the types of activities recommended.
                        INCLUDE a structured roadmapSteps array with 3-5 actionable steps.
                        """)
        LearningRecommendationDTO generateRecommendation(
                        @V("dataSummary") String dataSummary,
                        @V("studentName") String studentName,
                        @V("persona") String persona,
                        @V("language") String language);
}
