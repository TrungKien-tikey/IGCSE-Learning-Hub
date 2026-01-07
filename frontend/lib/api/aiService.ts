/**
 * AI Service Client
 * API calls để lấy kết quả chấm điểm từ AI Service
 */

import { DetailedGradingResultDTO, AIResultResponse, ApiErrorResponse } from "@/app/ai/types";

import { envConfig } from "@/config/env.config";

const AI_SERVICE_URL = envConfig.AI_SERVICE_URL;

class AIServiceError extends Error {
  constructor(
    public status: number,
    public message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

const handleApiError = async (response: Response): Promise<never> => {
  const status = response.status;
  const contentType = response.headers.get("content-type");

  let message = `HTTP ${status}: ${response.statusText}`;

  try {
    if (contentType?.includes("application/json")) {
      const data = (await response.json()) as ApiErrorResponse;
      message = data.message || message;
    } else {
      message = await response.text();
    }
  } catch (parseError: unknown) {
    // Fallback to default message
    console.debug("Failed to parse error response", parseError);
  }

  throw new AIServiceError(status, message);
};

export const aiService = {
  /**
   * Lấy kết quả tổng quan của một lượt chấm
   * GET /api/ai/result/{attemptId}
   */
  async getResult(attemptId: number): Promise<AIResultResponse> {
    const url = `${AI_SERVICE_URL}/api/ai/result/${attemptId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        0,
        `Failed to fetch result: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },

  /**
   * Lấy kết quả chi tiết từng câu
   * GET /api/ai/result/{attemptId}/details
   */
  async getDetailedResult(attemptId: number): Promise<DetailedGradingResultDTO> {
    const url = `${AI_SERVICE_URL}/api/ai/result/${attemptId}/details`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        0,
        `Failed to fetch detailed result: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },

  /**
   * Trigger chấm điểm (nếu chưa chấm)
   * POST /api/ai/mark-exam/{attemptId}
   */
  async markExam(
    attemptId: number,
    language: string = "auto"
  ): Promise<{ attemptId: number; score: number; passed: boolean }> {
    const url = `${AI_SERVICE_URL}/api/ai/mark-exam/${attemptId}?language=${encodeURIComponent(language)}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        0,
        `Failed to mark exam: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },

  /**
   * Health check
   * GET /api/ai/health
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    timestamp: number;
    supportedLanguages: string[];
    features: string[];
  }> {
    const url = `${AI_SERVICE_URL}/api/ai/health`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        0,
        `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },
};

export { AIServiceError };

