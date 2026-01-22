import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, ArrowLeft, RefreshCw, AlertCircle, ClipboardList } from "lucide-react";
import ResultHeader from "./components/ResultHeader";
import ResultSummary from "./components/ResultSummary";
import QuestionTypeBreakdown from "./components/QuestionTypeBreakdown";
import QuestionResultCard from "./components/QuestionResultCard";
import InsightCard from "./components/InsightCard";
import { getAttemptInsight, getResultDetails } from "./services/aiService";

export default function AIResultPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!attemptId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch result and insight in parallel
                const [resultData, insightData] = await Promise.all([
                    getResultDetails(attemptId),
                    getAttemptInsight(attemptId)
                ]);

                setResult(resultData);
                setInsight(insightData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [attemptId]);

    // Loading Skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <PageHeader />
                <div className="max-w-4xl mx-auto p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-slate-200 rounded-lg w-1/3"></div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="h-32 bg-slate-200 rounded-lg"></div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="h-24 bg-slate-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50">
                <PageHeader />
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-amber-800 mb-2">Đã xảy ra lỗi</h2>
                        <p className="text-amber-700 mb-6">{error}</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Thử lại
                            </button>
                            <button
                                onClick={() => navigate("/ai")}
                                className="px-5 py-2.5 border-2 border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition font-medium flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No Result
    if (!result) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-4xl mx-auto p-6 text-center">
                    <p className="text-gray-500">Không tìm thấy kết quả</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <PageHeader />

            <div className="max-w-4xl mx-auto p-6 pb-20">
                {/* Header */}
                <ResultHeader result={result} />

                {/* Summary Card */}
                <ResultSummary result={result} />

                {/* AI Insights - Only show if insight exists */}
                {insight && (
                    <div className="mt-6">
                        <InsightCard insight={insight} />
                    </div>
                )}

                {/* Question Type Breakdown */}
                <div className="mt-6">
                    <QuestionTypeBreakdown details={result.details} />
                </div>

                {/* Question Details */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-600" />
                        Chi tiết từng câu hỏi
                    </h3>

                    <div className="space-y-4">
                        {result.details?.map((detail, index) => (
                            <QuestionResultCard
                                key={detail.questionId || index}
                                detail={detail}
                                index={index}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

/**
 * Page Header Component
 */
function PageHeader() {
    return (
        <header className="bg-white border-b shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">AI Grading</h1>
                        <p className="text-sm text-gray-500">Kết quả chấm điểm thông minh</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
