/**
 * Exam Service API Client
 */

const EXAM_SERVICE_BASE_URL = import.meta.env.VITE_EXAM_SERVICE_URL;

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
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${EXAM_SERVICE_BASE_URL}${endpoint}`;
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
    throw new ApiError(
      error.message || "Không thể kết nối đến server",
      0,
      null
    );
  }
}

// ============================================
// Exam APIs
// ============================================

/**
 * Get all exams
 * @returns {Promise<Exam[]>}
 */
export async function getAllExams() {
  return fetchApi("");
}

/**
 * Get exam by ID
 * @param {number|string} examId 
 */
export async function getExamById(examId) {
  return fetchApi(`/${examId}`);
}

/**
 * Get attempts by exam ID
 * @param {number|string} examId 
 */
export async function getAttemptsByExamId(examId) {
  return fetchApi(`/attempts/${examId}`);
}

export default {
  getAllExams,
  getExamById,
  getAttemptsByExamId
};
