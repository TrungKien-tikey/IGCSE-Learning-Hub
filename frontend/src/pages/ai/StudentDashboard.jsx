import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Bot, ArrowLeft, RefreshCw, AlertCircle, FileText,
    TrendingUp, Trophy, TrendingDown, BarChart3
} from "lucide-react";
import { useStudentData } from "./hooks/useStudentData";
import StatisticsCard from "./components/StatisticsCard";
import PerformanceChart from "./components/PerformanceChart";
import RecommendationPanel from "./components/RecommendationPanel";
import InsightCard from "./components/InsightCard";

/**
 * Student Dashboard Page
 * Sử dụng lucide-react icons và màu sắc Material 3 style
 */
export default function StudentDashboard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const studentId = searchParams.get("studentId") || localStorage.getItem("userId") || "1";

    const { statistics, recommendations, insights, loading, error, retry } =
        useStudentData(studentId);

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <DashboardHeader />
                <div className="max-w-6xl mx-auto p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-slate-200 rounded-lg w-1/3"></div>
                        <div className="grid md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                                    <div className="h-20 bg-slate-200 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm h-64"></div>
                            <div className="bg-white rounded-xl p-6 shadow-sm h-64"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50">
                <DashboardHeader />
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-amber-800 mb-2">
                            Không thể tải Dashboard
                        </h2>
                        <p className="text-amber-700 mb-6">{error}</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={retry}
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

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader />

            <div className="max-w-6xl mx-auto p-6 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            Dashboard Học sinh
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Sinh viên: <span className="font-medium text-slate-700">{statistics?.studentName || studentId}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại trang chủ
                    </button>
                </div>

                {/* SECTION: Statistics Overview */}
                {statistics && (
                    <section className="mb-10">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-indigo-500 rounded" />
                            Tổng quan
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatisticsCard
                                icon={<FileText className="w-6 h-6" />}
                                label="Tổng bài thi"
                                value={statistics.totalExams}
                                color="blue"
                            />
                            <StatisticsCard
                                icon={<TrendingUp className="w-6 h-6" />}
                                label="Điểm trung bình"
                                value={statistics.averageScore?.toFixed(1) || "0"}
                                color="green"
                            />
                            <StatisticsCard
                                icon={<Trophy className="w-6 h-6" />}
                                label="Điểm cao nhất"
                                value={statistics.highestScore?.toFixed(1) || "0"}
                                color="yellow"
                            />
                            <StatisticsCard
                                icon={<TrendingDown className="w-6 h-6" />}
                                label="Điểm thấp nhất"
                                value={statistics.lowestScore?.toFixed(1) || "0"}
                                color="purple"
                            />
                        </div>
                    </section>
                )}

                {/* Improvement Rate */}
                {statistics?.improvementRate != null && (
                    <div className="mb-8">
                        <div
                            className={`p-4 rounded-xl shadow-sm ${statistics.improvementRate >= 0
                                ? "bg-emerald-50"
                                : "bg-amber-50"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statistics.improvementRate >= 0 ? "bg-emerald-100" : "bg-amber-100"
                                    }`}>
                                    {statistics.improvementRate >= 0 ? (
                                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                                    ) : (
                                        <TrendingDown className="w-6 h-6 text-amber-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Tỷ lệ cải thiện</p>
                                    <p
                                        className={`text-xl font-bold ${statistics.improvementRate >= 0
                                            ? "text-emerald-600"
                                            : "text-amber-600"
                                            }`}
                                    >
                                        {statistics.improvementRate >= 0 ? "+" : ""}
                                        {(statistics.improvementRate * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION: AI Insights */}
                {insights && (
                    <section className="mb-10">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-violet-500 rounded" />
                            Phân tích AI
                        </h2>
                        <InsightCard insight={insights} />
                    </section>
                )}

                {/* Charts & Recommendations */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    {statistics?.subjectPerformance && (
                        <PerformanceChart
                            data={statistics.subjectPerformance}
                            recentExams={statistics.recentExams}
                        />
                    )}
                    {recommendations && <RecommendationPanel data={recommendations} />}
                </div>

                {/* SECTION: Exam History Table */}
                {statistics?.recentExams && statistics.recentExams.length > 0 && (
                    <section className="mt-10">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-indigo-400 rounded" />
                            Lịch sử bài thi chi tiết
                        </h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Mã bài thi</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ngày nộp</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Trắc nghiệm</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Tự luận</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Tổng điểm</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {statistics.recentExams.map((exam) => (
                                            <tr key={exam.attemptId} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    #{exam.attemptId}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(exam.date).toLocaleDateString("vi-VN")}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold border border-blue-100">
                                                        {exam.mcScore != null ? exam.mcScore.toFixed(1) : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded-lg text-sm font-semibold border border-violet-100">
                                                        {exam.essayScore != null ? exam.essayScore.toFixed(1) : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span
                                                        className={`text-lg font-bold ${exam.totalScore >= 8
                                                            ? "text-emerald-500"
                                                            : exam.totalScore >= 5
                                                                ? "text-indigo-500"
                                                                : "text-orange-500"
                                                            }`}
                                                    >
                                                        {exam.totalScore?.toFixed(1) || "0.0"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => navigate(`/ai/results/${exam.attemptId}`)}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                                    >
                                                        Xem kết quả
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

/**
 * Dashboard Header Component
 */
function DashboardHeader() {
    return (
        <header className="bg-white border-b shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">AI Grading</h1>
                        <p className="text-sm text-slate-500">Dashboard học sinh</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
