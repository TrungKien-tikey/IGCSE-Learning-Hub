import { CheckCircle, XCircle, HelpCircle, Cpu, Shield } from "lucide-react";
import {
    formatNumber,
    getConfidenceColor,
    getEvaluationMethodLabel,
} from "../utils/format";

/**
 * QuestionResultCard - Card hiển thị kết quả từng câu hỏi
 * Sử dụng lucide-react icons và màu sắc Material 3 style
 */
export default function QuestionResultCard({ detail, index }) {
    const isMCQ = detail.questionType === "MULTIPLE_CHOICE" || detail.questionType === "MCQ";

    // Logic xác định đúng/sai thông minh hơn:
    // - Nếu điểm >= maxScore (full điểm) => đúng
    // - Với câu tự luận: điểm >= 50% maxScore => coi là "đạt"
    // - Fallback về API field nếu có
    const isCorrect = detail.isCorrect !== undefined
        ? detail.isCorrect
        : (detail.score >= detail.maxScore) || (!isMCQ && detail.score >= detail.maxScore * 0.5);

    // Màu sắc mới - soft và modern hơn
    const cardBorderColor = isCorrect
        ? "border-emerald-200 hover:border-emerald-300"
        : "border-amber-200 hover:border-amber-300";

    const numberBgColor = isCorrect
        ? "bg-emerald-500"
        : "bg-amber-500";

    const scoreColor = isCorrect
        ? "text-emerald-600"
        : "text-amber-600";

    const statusBg = isCorrect
        ? "bg-emerald-50 text-emerald-700"
        : "bg-amber-50 text-amber-700";

    return (
        <div
            className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all duration-200 ${cardBorderColor}`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${numberBgColor}`}
                    >
                        {index + 1}
                    </span>
                    <div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Câu hỏi #{detail.questionId}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isMCQ
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-violet-50 text-violet-700"
                                    }`}
                            >
                                {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                            </span>
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBg}`}
                            >
                                {isCorrect ? (
                                    <>
                                        <CheckCircle className="w-3 h-3" />
                                        Đúng
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-3 h-3" />
                                        Chưa đúng
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Score */}
                <div className="text-right">
                    <span className={`text-2xl font-bold ${scoreColor}`}>
                        {formatNumber(detail.score)}
                    </span>
                    <span className="text-gray-400 text-sm">
                        /{formatNumber(detail.maxScore)}
                    </span>
                </div>
            </div>

            {/* Feedback */}
            {detail.feedback && (
                <div className="bg-slate-50 rounded-lg p-4 mb-3 border border-slate-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {detail.feedback}
                    </p>
                </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-2 text-xs">
                <span
                    className={`px-2.5 py-1 rounded-full flex items-center gap-1 ${getConfidenceColor(
                        detail.confidence >= 0.8
                            ? "HIGH"
                            : detail.confidence >= 0.5
                                ? "MEDIUM"
                                : "LOW"
                    )}`}
                >
                    <Shield className="w-3 h-3" />
                    {(detail.confidence * 100).toFixed(0)}%
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {getEvaluationMethodLabel(detail.evaluationMethod)}
                </span>
            </div>
        </div>
    );
}
