/**
 * AI Service API Client
 * Centralized API calls for AI module
 */

const AI_SERVICE_BASE_URL = "http://localhost:8082/api/ai";

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${AI_SERVICE_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // Ignore JSON parse error
      }
      throw new ApiError(
        errorData?.message || `HTTP Error: ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other issues
    throw new ApiError(
      error.message || "Không thể kết nối đến server",
      0,
      null
    );
  }
}

// ============================================
// Grading Results APIs
// ============================================

/**
 * Lấy kết quả chấm điểm cơ bản
 * @param {number|string} attemptId 
 * @returns {Promise<AIResultResponse>}
 */
export async function getResult(attemptId) {
  return fetchApi(`/result/${attemptId}`);
}

/**
 * Lấy kết quả chấm điểm chi tiết từng câu
 * @param {number|string} attemptId 
 * @returns {Promise<DetailedGradingResultDTO>}
 */
export async function getDetailedResult(attemptId) {
  return fetchApi(`/result/${attemptId}/details`);
}

// ============================================
// Statistics APIs
// ============================================

/**
 * Lấy thống kê học sinh
 * @param {number|string} studentId 
 * @returns {Promise<StudentStatisticsDTO>}
 */
export async function getStudentStatistics(studentId) {
  return fetchApi(`/statistics/student/${studentId}`);
}

// ============================================
// Recommendations API
// ============================================

/**
 * Lấy gợi ý học tập cho học sinh
 * @param {number|string} studentId 
 * @returns {Promise<LearningRecommendationDTO>}
 */
export async function getRecommendations(studentId) {
  return fetchApi(`/recommendations/${studentId}`);
}

// ============================================
// Insights API
// ============================================

/**
 * Lấy AI insights cho học sinh
 * @param {number|string} studentId 
 * @returns {Promise<AIInsightDTO>}
 */
export async function getInsights(studentId) {
  return fetchApi(`/insights/student/${studentId}`);
}

// ============================================
// Health Check
// ============================================

/**
 * Kiểm tra trạng thái AI Service
 * @returns {Promise<{status: string, service: string}>}
 */
export async function healthCheck() {
  return fetchApi("/health");
}

// Export error class for external use
export { ApiError };
