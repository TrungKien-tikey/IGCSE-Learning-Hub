import { useState, useEffect, useCallback } from "react";
import {
  getStudentStatistics,
  getRecommendations,
  getInsights,
  ApiError,
} from "../../../api/aiService";

/**
 * Custom hook để fetch tất cả data cho Student Dashboard
 * Kết hợp statistics, recommendations, và insights
 * 
 * @param {string|number} studentId - ID của học sinh
 * @returns {Object} - State và actions
 */
export function useStudentData(studentId) {
  const [statistics, setStatistics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setError("Student ID không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch song song tất cả APIs
      const [statsResult, recsResult, insightsResult] = await Promise.allSettled([
        getStudentStatistics(studentId),
        getRecommendations(studentId),
        getInsights(studentId),
      ]);

      // Statistics là required, nếu fail thì throw error
      if (statsResult.status === "fulfilled") {
        setStatistics(statsResult.value);
      } else {
        throw statsResult.reason;
      }

      // Recommendations và Insights là optional
      if (recsResult.status === "fulfilled") {
        setRecommendations(recsResult.value);
      } else {
        console.warn("Failed to fetch recommendations:", recsResult.reason);
        setRecommendations(null);
      }

      if (insightsResult.status === "fulfilled") {
        setInsights(insightsResult.value);
      } else {
        console.warn("Failed to fetch insights:", insightsResult.reason);
        setInsights(null);
      }
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : "Không thể tải dữ liệu học sinh";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Auto fetch on mount và khi studentId thay đổi
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retry function
  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    statistics,
    recommendations,
    insights,
    loading,
    error,
    retry,
  };
}
