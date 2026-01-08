/**
 * Utility functions cho AI module
 */

// Format số với 2 decimal places
export function formatNumber(value) {
  if (value == null) return "0";
  return Number(value).toFixed(2);
}

// Format phần trăm 
export function formatPercentage(value) {
  if (value == null) return "0%";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

// Tính phần trăm điểm
export function calculatePercentage(score, maxScore) {
  if (!maxScore || maxScore === 0) return 0;
  return (score / maxScore) * 100;
}

// Format ngày giờ theo locale vi-VN
export function formatDateTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Màu theo confidence level
export function getConfidenceColor(level) {
  switch (level) {
    case "HIGH":
      return "text-green-600 bg-green-100";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-100";
    case "LOW":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

// Màu theo điểm (percentage)
export function getScoreColor(percentage) {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 50) return "text-yellow-600";
  return "text-red-600";
}

// Label hiển thị phương pháp chấm
export function getEvaluationMethodLabel(method) {
  switch (method) {
    case "AI_GPT4_LANGCHAIN":
      return "AI (GPT-4)";
    case "LOCAL_RULE_BASED":
      return "Rule-based";
    default:
      return method || "Tự động";
  }
}

// Màu theo evaluation method  
export function getMethodColor(method) {
  if (method === "AI_GPT4_LANGCHAIN") {
    return "text-purple-600 bg-purple-100";
  }
  return "text-blue-600 bg-blue-100";
}
