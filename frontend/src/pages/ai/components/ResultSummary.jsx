import { useState } from "react";
import {
    Award, TrendingUp, Shield, BarChart3, FileText, PenTool,
    MessageSquare, ChevronDown, ChevronUp
} from "lucide-react";
import {
    formatNumber,
    calculatePercentage,
    getConfidenceColor,
} from "../utils/format";

/**
 * ResultSummary - Card tổng kết điểm số
 * Bao gồm tóm tắt thống kê và nhận xét AI với expandable section
 */
export default function ResultSummary({ result }) {
    const [expanded, setExpanded] = useState(false);

    const percentage = calculatePercentage(result.score, result.maxScore);
    const passed = result.score >= result.maxScore * 0.5;

    // Tính toán breakdown theo loại câu hỏi
    const details = result.details || [];
    const mcqQuestions = details.filter(
        (d) => d.questionType === "MULTIPLE_CHOICE" || d.questionType === "MCQ"
    );
    const essayQuestions = details.filter(
        (d) => d.questionType !== "MULTIPLE_CHOICE" && d.questionType !== "MCQ"
    );

    // MCQ stats
    const mcqCorrect = mcqQuestions.filter((d) => d.isCorrect || d.score >= d.maxScore).length;

    // Essay stats (đạt = >= 50% điểm)
    const essayCorrect = essayQuestions.filter(
        (d) => d.isCorrect || d.score >= d.maxScore * 0.5
    ).length;

    // Tổng câu đúng
    const totalCorrect = mcqCorrect + essayCorrect;
    const totalQuestions = details.length;

    // Lọc feedback: bỏ phần template, chỉ giữ phần AI
    const extractAiFeedback = (rawFeedback) => {
        if (!rawFeedback) return null;

        // Tìm phần AI feedback (sau "Chi tiết từng câu:" và feedback của câu cuối)
        const lines = rawFeedback.split('\n').filter(line => line.trim());

        // Lọc bỏ các dòng template
        const templatePatterns = [
            /^Tổng điểm:/i,
            /^Total score:/i,
            /^Xuất sắc!/i,
            /^Tốt!/i,
            /^Đạt yêu cầu/i,
            /^Chưa đạt/i,
            /^Excellent!/i,
            /^Good!/i,
            /^Pass\./i,
            /^Not pass/i,
            /^Chi tiết từng câu:/i,
            /^Details per question:/i,
            /^- Câu \d+:/i,
            /^- Q\d+:/i,
            /^Số câu đúng:/i,
        ];

        // Tìm các phần feedback AI thực sự (phần sau dấu " - " trong mỗi dòng Chi tiết)
        const aiFeedbacks = [];
        for (const line of lines) {
            // Match pattern: "- Câu X: score/max (Độ tin cậy: X%) - ACTUAL_AI_FEEDBACK"
            const match = line.match(/- (?:Câu|Q)\s*\d+:.*?(?:Độ tin cậy|Confidence):\s*\d+%\)\s*-\s*(.+)/i);
            if (match && match[1]) {
                aiFeedbacks.push(match[1].trim());
            }
        }

        // Nếu tìm thấy AI feedback, gộp lại
        if (aiFeedbacks.length > 0) {
            return aiFeedbacks.join('\n\n');
        }

        // Fallback: trả về null nếu không tìm thấy
        return null;
    };

    const aiFeedback = extractAiFeedback(result.feedback);
    const hasAiFeedback = aiFeedback && aiFeedback.trim().length > 0;

    // Display text cho phần nhận xét
    const displayFeedback = hasAiFeedback ? aiFeedback : "Không có nhận xét chi tiết từ AI.";
    const isLongFeedback = displayFeedback.length > 200;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 overflow-hidden">
            <div className="grid md:grid-cols-3 gap-6">
                {/* Score Circle với Animation */}
                <div className="flex flex-col items-center justify-center">
                    <div
                        className={`relative w-36 h-36 rounded-full border-[6px] flex items-center justify-center shadow-lg transition-all duration-500 animate-[pulse_2s_ease-in-out_1] ${passed
                            ? "border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
                            : "border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
                            }`}
                    >
                        {/* Animated ring */}
                        <div
                            className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin-slow ${passed ? "border-t-emerald-200" : "border-t-amber-200"
                                }`}
                            style={{ animationDuration: "3s" }}
                        />
                        <div className="text-center z-10">
                            <span
                                className={`text-4xl font-bold transition-all duration-300 ${passed ? "text-emerald-600" : "text-amber-600"
                                    }`}
                            >
                                {formatNumber(result.score)}
                            </span>
                            <span className="text-slate-400 text-sm block mt-1">
                                / {formatNumber(result.maxScore)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <span
                            className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md transition-transform hover:scale-105 ${passed
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-500 text-white"
                                }`}
                        >
                            <Award className="w-4 h-4" />
                            {passed ? "ĐẠT" : "CHƯA ĐẠT"}
                        </span>
                    </div>
                </div>

                {/* Stats Panel */}
                <div className="flex flex-col justify-center space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Thống kê chi tiết
                    </h4>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <span className="text-slate-600 flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            Tỉ lệ đúng
                        </span>
                        <span className={`font-bold text-lg ${passed ? "text-emerald-600" : "text-amber-600"}`}>
                            {percentage.toFixed(1)}%
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <span className="text-slate-600 flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-indigo-500" />
                            Độ tin cậy
                        </span>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(
                                result.confidence >= 0.8
                                    ? "HIGH"
                                    : result.confidence >= 0.5
                                        ? "MEDIUM"
                                        : "LOW"
                            )}`}
                        >
                            {(result.confidence * 100).toFixed(0)}%
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <span className="text-slate-600 text-sm">Tổng câu hỏi</span>
                        <span className="font-bold text-lg text-slate-800">{totalQuestions}</span>
                    </div>
                </div>

                {/* Tóm tắt + Nhận xét AI */}
                <div className="flex flex-col justify-start space-y-4">
                    {/* Tóm tắt thống kê */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-indigo-500" />
                            Tóm tắt
                        </h4>
                        <p className={`text-lg font-bold mb-3 ${passed ? "text-emerald-600" : "text-amber-600"}`}>
                            {totalCorrect}/{totalQuestions} câu đúng ({percentage.toFixed(0)}%)
                        </p>
                        <div className="space-y-2 text-sm text-slate-600">
                            {mcqQuestions.length > 0 && (
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span>Trắc nghiệm:</span>
                                    <span className="font-semibold text-blue-700">{mcqCorrect}/{mcqQuestions.length}</span>
                                </div>
                            )}
                            {essayQuestions.length > 0 && (
                                <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-lg">
                                    <PenTool className="w-4 h-4 text-violet-500" />
                                    <span>Tự luận:</span>
                                    <span className="font-semibold text-violet-700">{essayCorrect}/{essayQuestions.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nhận xét AI - Expandable */}
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
                        <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            Nhận xét AI
                        </h4>
                        <div
                            className={`text-slate-700 leading-7 tracking-wide transition-all duration-300 overflow-hidden ${expanded || !isLongFeedback ? "max-h-none" : "max-h-24"
                                }`}
                            style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
                        >
                            <p className="text-[15px] whitespace-pre-line">{displayFeedback}</p>
                        </div>
                        {isLongFeedback && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                                {expanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        Thu gọn
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        Xem thêm
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
