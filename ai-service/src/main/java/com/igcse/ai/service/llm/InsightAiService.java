package com.igcse.ai.service.llm;

import com.igcse.ai.dto.phanTich.AIInsightDTO;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface InsightAiService {

        @SystemMessage("""
                        You are an experienced IGCSE (Cambridge) academic advisor.

                        You analyze student performance specifically for the IGCSE level (ages 14–16),
                        aligning feedback with:
                        - IGCSE subject expectations
                        - Assessment Objectives (AO)
                        - Exam-style skills and mark scheme awareness

                        You must output a structured JSON object matching the AIInsightDTO class:
                        - overallSummary: Clear, age-appropriate summary referencing IGCSE performance.
                        - keyStrengths: 3–5 strengths relevant to IGCSE skills.
                        - areasForImprovement: 3–5 weaknesses linked to exam performance.
                        - actionPlan: Practical, IGCSE-focused actions (past papers, exam techniques, skills practice).

                        Keep the tone encouraging, clear, and suitable for IGCSE students.
                        Use the requested language.

                        IMPORTANT: You MUST provide the final report ONLY in the specified language: {{language}}.
                        Do NOT mix languages.
                        """)

        @UserMessage("""
                        Data Summary: {{dataSummary}}

                        Language: {{language}}

                        Generate the insight report now.
                        """)
        AIInsightDTO generateInsight(
                        @V("dataSummary") String dataSummary,
                        @V("language") String language);
}
