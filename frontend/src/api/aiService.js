/**
 * AI Service API Client
 * Centralized API calls for AI module
 */

const AI_SERVICE_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL;

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
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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
 * Validate ID parameter
 * @param {any} id - ID to validate
 * @param {string} paramName - Name of parameter for error message
 * @throws {ApiError} If ID is invalid
 */
function validateId(id, paramName = "ID") {
  // Convert to string for consistent checking
  const idStr = String(id).trim();
  
  if (!id || id === "undefined" || id === "null" || idStr === "") {
    throw new ApiError(`${paramName} không được để trống`, 400);
  }
  
  // Parse to number and check if valid positive integer
  const numId = parseInt(idStr, 10);
  if (isNaN(numId) || numId <= 0) {
    throw new ApiError(`${paramName} phải là số nguyên dương hợp lệ`, 400);
  }
}


/**
 * Lấy kết quả chấm điểm cơ bản
 * @param {number|string} attemptId 
 * @returns {Promise<AIResultResponse>}
 */
export async function getResult(attemptId) {
  validateId(attemptId, "Attempt ID");
  return fetchApi(`/result/${attemptId}`);
}

/**
 * Lấy kết quả chấm điểm chi tiết từng câu
 * @param {number|string} attemptId 
 * @returns {Promise<DetailedGradingResultDTO>}
 */
export async function getDetailedResult(attemptId) {
  validateId(attemptId, "Attempt ID");
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
  validateId(studentId, "Student ID");
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
  validateId(studentId, "Student ID");
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
  validateId(studentId, "Student ID");
  return fetchApi(`/insights/student/${studentId}`);
}

/**
 * Lấy thống kê nâng cao (Learning Curve, Effort)
 * @param {number|string} studentId
 * @returns {Promise<LearningAnalyticsDTO>}
 */
export async function getLearningAnalytics(studentId) {
  validateId(studentId, "Student ID");
  return fetchApi(`/statistics/analytics/${studentId}`);
}

/**
 * Lấy tóm tắt dành cho phụ huynh
 * @param {number|string} studentId
 * @returns {Promise<ParentSummaryDTO>}
 */
export async function getParentSummary(studentId) {
  validateId(studentId, "Student ID");
  return fetchApi(`/statistics/parent/summary/${studentId}`);
}

/**
 * Get participated exams for a class
 * @param {number|string} classId
 * @returns {Promise<number[]>} List of Exam IDs
 */
export async function getParticipatedExams(classId) {
  validateId(classId, "Class ID");
  return fetchApi(`/statistics/class/${classId}/exams`);
}

/**
 * Get detailed statistics for an exam
 * @param {number|string} examId
 * @param {number|string} classId
 * @returns {Promise<ExamStatisticsDTO>}
 */
export async function getExamStatistics(examId, classId) {
  validateId(examId, "Exam ID");
  let url = `/statistics/exam/${examId}`;
  if (classId) {
    url += `?classId=${classId}`;
  }
  return fetchApi(url);
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
