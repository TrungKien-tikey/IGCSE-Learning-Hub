/**
 * QuestionResultCard Component
 * Card hiển thị kết quả chi tiết một câu hỏi
 */

import {
  calculatePercentage,
  formatNumber,
  getConfidenceColor,
  getScoreColor,
  getEvaluationMethodLabel,
} from "@/app/ai/utils/format";
import type { GradingResult } from "@/app/ai/types";

interface QuestionResultCardProps {
  result: GradingResult;
  questionNumber: number;
  questionContent?: string;
  studentAnswer?: string;
  referenceAnswer?: string;
}

export function QuestionResultCard({
  result,
  questionNumber,
  questionContent,
  studentAnswer,
  referenceAnswer,
}: QuestionResultCardProps) {
  const percentage = calculatePercentage(result.score, result.maxScore);
  const isPassed = result.score >= result.maxScore * 0.5;
  const scoreColor = getScoreColor(result.score, result.maxScore);
  const confidenceColor = getConfidenceColor(result.confidence);
  const methodInfo = getEvaluationMethodLabel(result.evaluationMethod);

  return (
    <div
      className={`${scoreColor.bg} border-2 ${scoreColor.border} rounded-lg shadow-sm hover:shadow-md transition p-6 mb-4`}
    >
      {/* Header: Question Number + Type + Score */}
      <div className="flex justify-between items-start gap-6 mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Question Number Badge */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
              isPassed
                ? "bg-green-200 text-green-700"
                : "bg-red-200 text-red-700"
            }`}
          >
            {questionNumber}
          </div>

          {/* Question Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 mb-1">
              Câu {questionNumber}
              <span className="ml-2 text-sm font-normal text-gray-600">
                {result.questionType === "ESSAY" ? "📝 Tự luận" : "🔘 Trắc nghiệm"}
              </span>
            </h4>

            {questionContent && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {questionContent}
              </p>
            )}
          </div>
        </div>

        {/* Score Display */}
        <div className="text-right flex-shrink-0">
          <div className={`text-3xl font-bold ${scoreColor.text}`}>
            {formatNumber(result.score, 1)}
          </div>
          <div className="text-sm text-gray-600">
            / {formatNumber(result.maxScore, 0)}
          </div>
          <div className="text-lg font-semibold text-gray-700 mt-1">
            {percentage.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Student Answer */}
      {studentAnswer && (
        <div className="mb-4 p-4 bg-white border-l-4 border-blue-500 rounded">
          <p className="text-xs font-bold text-blue-700 mb-2">
            ✏️ CÂU TRẢ LỜI CỦA BẠN
          </p>
          <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
            {studentAnswer}
          </p>
        </div>
      )}

      {/* Reference Answer */}
      {referenceAnswer && result.questionType === "ESSAY" && (
        <details className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <summary className="cursor-pointer font-semibold text-green-800 mb-2">
            📚 Đáp án tham khảo
          </summary>
          <p className="text-green-800 whitespace-pre-wrap text-sm leading-relaxed">
            {referenceAnswer}
          </p>
        </details>
      )}

      {/* AI Feedback */}
      <div className="mb-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
        <p className="text-xs font-bold text-indigo-700 mb-2">
          💬 NHẬN XÉT TỪ AI
        </p>
        <p className="text-indigo-900 whitespace-pre-wrap text-sm leading-relaxed">
          {result.feedback}
        </p>
      </div>

      {/* Footer: Confidence + Method */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-300">
        {/* Confidence Badge */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-700">
            Độ tin cậy:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${confidenceColor.badge}`}
          >
            {(result.confidence * 100).toFixed(0)}%
          </span>
        </div>

        {/* Method Badge */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <span>{methodInfo.icon}</span>
          <span>{methodInfo.label}</span>
        </div>

        {/* Status Indicator */}
        <div>
          {isPassed ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
              <span>✅</span> Đạt yêu cầu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
              <span>❌</span> Chưa đạt
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {result.evaluationMethod === "ERROR_FALLBACK" && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-700 font-medium">
            ⚠️ Chấm điểm thất bại: AI Service có lỗi. Vui lòng thử lại sau hoặc
            liên hệ giáo viên.
          </p>
        </div>
      )}
    </div>
  );
}
