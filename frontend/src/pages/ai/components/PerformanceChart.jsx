import { BarChart3, Star, TrendingUp, AlertCircle } from "lucide-react";

/**
 * PerformanceChart - Hiệu suất theo môn học
 * Thiết kế thân thiện với học sinh, có feedback động viên
 */
export default function PerformanceChart({ data }) {
    // data là object { "Môn A": 8.5, "Môn B": 7.2, ... }
    const subjects = Object.entries(data || {});

    if (!subjects.length) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                    Hiệu suất theo môn học
                </h3>
                <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Chưa có dữ liệu bài thi</p>
                </div>
            </div>
        );
    }

    // Tìm max để scale bars
    const maxScore = Math.max(...subjects.map(([_, score]) => score), 10);

    // Phân loại điểm với feedback thân thiện
    const getScoreInfo = (score) => {
        if (score >= 8) {
            return {
                label: "Xuất sắc!",
                color: "text-emerald-600",
                bgColor: "bg-emerald-500",
                lightBg: "bg-emerald-50",
                icon: Star,
                message: "🌟 Giỏi quá!"
            };
        }
        if (score >= 7) {
            return {
                label: "Tốt",
                color: "text-teal-600",
                bgColor: "bg-teal-500",
                lightBg: "bg-teal-50",
                icon: TrendingUp,
                message: "👍 Làm tốt lắm!"
            };
        }
        if (score >= 5) {
            return {
                label: "Khá",
                color: "text-amber-600",
                bgColor: "bg-amber-400",
                lightBg: "bg-amber-50",
                icon: TrendingUp,
                message: "💪 Cố gắng thêm nhé!"
            };
        }
        return {
            label: "Cần cải thiện",
            color: "text-orange-600",
            bgColor: "bg-orange-400",
            lightBg: "bg-orange-50",
            icon: AlertCircle,
            message: "📚 Ôn tập thêm nha!"
        };
    };

    // Tính trung bình
    const avgScore = subjects.reduce((sum, [_, score]) => sum + score, 0) / subjects.length;
    const avgInfo = getScoreInfo(avgScore);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-teal-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Hiệu suất theo môn học
                </h3>
                <p className="text-teal-100 text-sm mt-1">
                    Điểm trung bình: <span className="font-bold text-white">{avgScore.toFixed(1)}/10</span>
                    <span className="ml-2">{avgInfo.message}</span>
                </p>
            </div>

            <div className="p-6">
                {/* Bars */}
                <div className="space-y-4">
                    {subjects.map(([subject, score]) => {
                        const percentage = (score / maxScore) * 100;
                        const info = getScoreInfo(score);
                        const Icon = info.icon;

                        return (
                            <div key={subject} className={`p-3 rounded-xl ${info.lightBg}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${info.color}`} />
                                        <span className="text-slate-700 font-medium">{subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium ${info.color}`}>
                                            {info.label}
                                        </span>
                                        <span className={`font-bold text-lg ${info.color}`}>
                                            {score.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 bg-white/80 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full rounded-full ${info.bgColor}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend - thân thiện hơn */}
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-emerald-500" />
                        Xuất sắc (≥8)
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-teal-50 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3 text-teal-500" />
                        Tốt (7-8)
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-amber-50 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3 text-amber-500" />
                        Khá (5-7)
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-orange-50 px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        Cần cải thiện (&lt;5)
                    </span>
                </div>
            </div>
        </div>
    );
}
