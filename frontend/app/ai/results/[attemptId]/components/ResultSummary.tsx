/**
 * ResultSummary Component
 * Hiển thị thông tin tóm tắt: Confidence, Method, Language, Feedback
 */

import {
  getConfidenceColor,
  getEvaluationMethodLabel,
} from "@/app/ai/utils/format";
import type { ConfidenceLevel } from "@/app/ai/types";

interface ResultSummaryProps {
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  evaluationMethod: string;
  language: string;
  overallFeedback: string;
}

export function ResultSummary({
  confidence,
  confidenceLevel,
  evaluationMethod,
  language,
  overallFeedback,
}: ResultSummaryProps) {
  const confidenceColor = getConfidenceColor(confidence);
  const methodInfo = getEvaluationMethodLabel(evaluationMethod);

  const languageLabel = {
    en: "🇬🇧 English",
    vi: "🇻🇳 Tiếng Việt",
    auto: "🔄 Auto-detect",
  }[language as "en" | "vi" | "auto"] || language;

  const getConfidenceLevelLabel = (): string => {
    switch (confidenceLevel) {
      case "HIGH":
        return "Rất cao";
      case "MEDIUM":
        return "Trung bình";
      case "LOW":
        return "Thấp";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📊 Thông tin chấm điểm
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Confidence Card */}
        <div className={`${confidenceColor.bg} border rounded-lg p-4`}>
          <p className="text-xs text-gray-600 font-medium mb-1">ĐỘ TIN CẬY</p>
          <p className={`text-2xl font-bold ${confidenceColor.text} mb-1`}>
            {(confidence * 100).toFixed(0)}%
          </p>
          <p className={`text-sm font-medium ${confidenceColor.text}`}>
            {getConfidenceLevelLabel()}
          </p>
        </div>

        {/* Method Card */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">PHƯƠNG PHÁP</p>
          <p className="text-lg font-bold text-indigo-700 mb-1">
            {methodInfo.icon} {methodInfo.label}
          </p>
          <p className="text-xs text-indigo-600">Chấm điểm tự động</p>
        </div>

        {/* Language Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">NGÔN NGỮ</p>
          <p className="text-lg font-bold text-purple-700 mb-1">
            {languageLabel}
          </p>
          <p className="text-xs text-purple-600">Phản hồi cho học sinh</p>
        </div>

        {/* Status Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">TRẠNG THÁI</p>
          <p className="text-lg font-bold text-blue-700 mb-1">Hoàn thành</p>
          <p className="text-xs text-blue-600">Sẵn sàng xem chi tiết</p>
        </div>
      </div>

      {/* Feedback Section */}
      {overallFeedback && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💬</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                Nhận xét tổng quan
              </h4>
              <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                {overallFeedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>💡 Lưu ý:</strong> Kết quả chấm được cung cấp bởi AI Service
          dựa trên{" "}
          {evaluationMethod === "AI_GPT4_LANGCHAIN"
            ? "mô hình GPT-4"
            : "quy tắc tự động"}
          . Bạn có thể yêu cầu giáo viên kiểm tra lại nếu cảm thấy cần thiết.
        </p>
      </div>
    </div>
  );
}
