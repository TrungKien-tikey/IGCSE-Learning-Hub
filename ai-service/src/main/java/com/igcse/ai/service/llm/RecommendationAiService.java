package com.igcse.ai.service.llm;

import com.igcse.ai.dto.goiyLoTrinhHoc.LearningRecommendationDTO;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

/**
 * Interface AI Service để tạo gợi ý học tập sử dụng LangChain4j
 */
public interface RecommendationAiService {

        @SystemMessage("""
                        You are an experienced IGCSE (Cambridge) educational consultant and learning path designer.

                        You specialize in analyzing IGCSE exam performance (ages 14–16) and designing targeted learning plans aligned with:
                        - IGCSE subject expectations
                        - Assessment Objectives (AO)
                        - Exam-style questions and mark schemes

                        You must output a structured JSON object matching the LearningRecommendationDTO class:
                        - weakTopics: Specific IGCSE topics or question types where performance is below 50%.
                        - strongTopics: IGCSE topics or skills where performance is above 80%.
                        - recommendedResources: 3–5 concrete, IGCSE-appropriate resources (e.g., past paper practice, exam-style questions, topic-based worksheets, short revision videos).
                        - learningPathSuggestion: A clear 2–3 sentence plan focusing on improving IGCSE exam performance.

                        Use the requested language.
                        Keep advice age-appropriate, encouraging, and exam-focused.

                        IMPORTANT: You MUST provide the final report ONLY in the specified language: {{language}}.
                        Do NOT mix languages.
                        """)

        @UserMessage("""
                        Performance Data Summary: {{dataSummary}}

                        Language: {{language}}

                        Generate the learning recommendation report now.
                        """)
        LearningRecommendationDTO generateRecommendation(
                        @V("dataSummary") String dataSummary,
                        @V("language") String language);
}
