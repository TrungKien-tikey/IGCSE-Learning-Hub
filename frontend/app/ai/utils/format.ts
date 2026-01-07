/**
 * Utility functions cho formatting
 */

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const calculatePercentage = (score: number, maxScore: number): number => {
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export const getConfidenceColor = (
  confidence: number
): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} => {
  if (confidence >= 0.8) {
    return {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
    };
  }
  if (confidence >= 0.5) {
    return {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
    };
  }
  return {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
  };
};

export const getScoreColor = (
  score: number,
  maxScore: number
): {
  bg: string;
  text: string;
  border: string;
} => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) {
    return {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    };
  }
  if (percentage >= 60) {
    return {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
  }
  if (percentage >= 50) {
    return {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    };
  }
  return {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  };
};

export const getEvaluationMethodLabel = (
  method: string
): { icon: string; label: string } => {
  if (method === "AI_GPT4_LANGCHAIN") {
    return { icon: "🤖", label: "AI GPT-4 (LangChain)" };
  }
  if (method === "LOCAL_RULE_BASED") {
    return { icon: "📋", label: "Rule-based" };
  }
  return { icon: "⚠️", label: "Fallback" };
};

