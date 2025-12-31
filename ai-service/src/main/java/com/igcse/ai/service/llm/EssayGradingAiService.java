package com.igcse.ai.service.llm;

import com.igcse.ai.dto.aiChamDiem.EssayGradeResultDTO;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface EssayGradingAiService {

        @SystemMessage("""
                        You are an expert IGCSE examiner. Your task is to grade student essay answers accurately and fairly.
                        You must evaluate the answer based on the provided Question, Reference Answer, and Max Score.

                        Unclear or irrelevant answers should receive a low score.
                        You must provide constructive feedback to help the student improve.
                        You must also estimate your confidence in this grading (0.0 - 1.0) based on how well the student answer matches the reference key concepts.

                        IMPORTANT: You MUST provide the feedback ONLY in the specified language: {{language}}.
                        Do NOT mix languages. If the language is Vietnamese, all feedback MUST be in Vietnamese.
                        """)
        @UserMessage("""
                        Question: {{question}}
                        Max Score: {{maxScore}}
                        Reference Answer: {{referenceAnswer}}

                        Student Answer: {{studentAnswer}}

                        Language: {{language}}

                        Grade this answer now.
                        """)
        EssayGradeResultDTO gradeEssay(
                        @V("question") String question,
                        @V("maxScore") double maxScore,
                        @V("referenceAnswer") String referenceAnswer,
                        @V("studentAnswer") String studentAnswer,
                        @V("language") String language);
}
