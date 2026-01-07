/**
 * AI Service Types - Standalone AI Result Grading System
 * Chỉ lấy dữ liệu từ AI Service
 */

export interface GradingResult {
  questionId: number;
  questionType: "ESSAY" | "MCQ";
  score: number;
  maxScore: number;
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  evaluationMethod: "AI_GPT4_LANGCHAIN" | "LOCAL_RULE_BASED" | "ERROR_FALLBACK";
}

export interface AIResultResponse {
  resultId: number;
  attemptId: number;
  score: number;
  feedback: string;
  gradedAt: string;
  passed: boolean;
  language: "en" | "vi" | "auto";
  confidence: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  evaluationMethod: "AI_GPT4_LANGCHAIN" | "LOCAL_RULE_BASED";
}

export interface DetailedGradingResultDTO {
  attemptId: number;
  score: number;
  maxScore: number;
  feedback: string;
  confidence: number;
  language: string;
  details: GradingResult[];
}

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface ApiErrorResponse {
  status: number;
  message: string;
  timestamp?: string;
}

