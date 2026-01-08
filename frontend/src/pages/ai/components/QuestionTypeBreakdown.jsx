import { CheckCircle, FileText, PenTool } from "lucide-react";

/**
 * QuestionTypeBreakdown - Thống kê theo loại câu hỏi
 * Hiển thị breakdown MCQ vs Essay với số câu đúng, điểm, và tỉ lệ
 */
export default function QuestionTypeBreakdown({ details }) {
    if (!details || details.length === 0) return null;

    // Phân loại và tính toán
    const mcqQuestions = details.filter(
        (d) => d.questionType === "MULTIPLE_CHOICE" || d.questionType === "MCQ"
    );
    const essayQuestions = details.filter(
        (d) => d.questionType !== "MULTIPLE_CHOICE" && d.questionType !== "MCQ"
    );

    // Tính toán cho MCQ
    const mcqCorrect = mcqQuestions.filter((d) => d.isCorrect || d.score >= d.maxScore).length;
    const mcqScore = mcqQuestions.reduce((sum, d) => sum + (d.score || 0), 0);
    const mcqMaxScore = mcqQuestions.reduce((sum, d) => sum + (d.maxScore || 0), 0);
    const mcqPercent = mcqMaxScore > 0 ? (mcqScore / mcqMaxScore) * 100 : 0;

    // Tính toán cho Essay
    const essayCorrect = essayQuestions.filter(
        (d) => d.isCorrect || d.score >= d.maxScore * 0.5
    ).length;
    const essayScore = essayQuestions.reduce((sum, d) => sum + (d.score || 0), 0);
    const essayMaxScore = essayQuestions.reduce((sum, d) => sum + (d.maxScore || 0), 0);
    const essayPercent = essayMaxScore > 0 ? (essayScore / essayMaxScore) * 100 : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Thống kê theo loại câu hỏi
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
                {/* MCQ Card */}
                {mcqQuestions.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-semibold text-blue-800">Trắc nghiệm (MCQ)</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-700">Số câu đúng</span>
                                <span className="font-bold text-blue-800">
                                    {mcqCorrect}/{mcqQuestions.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Điểm</span>
                                <span className="font-bold text-blue-800">
                                    {mcqScore.toFixed(1)}/{mcqMaxScore.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Tỉ lệ đúng</span>
                                <span className={`font-bold ${mcqPercent >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
                                    {mcqPercent.toFixed(1)}%
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-2 bg-blue-200 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full rounded-full ${mcqPercent >= 50 ? "bg-emerald-500" : "bg-amber-500"}`}
                                    style={{ width: `${mcqPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Essay Card */}
                {essayQuestions.length > 0 && (
                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                                <PenTool className="w-4 h-4 text-violet-600" />
                            </div>
                            <span className="font-semibold text-violet-800">Tự luận (Essay)</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-violet-700">Số câu đạt</span>
                                <span className="font-bold text-violet-800">
                                    {essayCorrect}/{essayQuestions.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-violet-700">Điểm</span>
                                <span className="font-bold text-violet-800">
                                    {essayScore.toFixed(1)}/{essayMaxScore.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-violet-700">Tỉ lệ điểm</span>
                                <span className={`font-bold ${essayPercent >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
                                    {essayPercent.toFixed(1)}%
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-2 bg-violet-200 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full rounded-full ${essayPercent >= 50 ? "bg-emerald-500" : "bg-amber-500"}`}
                                    style={{ width: `${essayPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* No questions message */}
            {mcqQuestions.length === 0 && essayQuestions.length === 0 && (
                <p className="text-slate-500 text-center py-4">Không có dữ liệu câu hỏi</p>
            )}
        </div>
    );
}
