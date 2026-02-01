import {
    Lightbulb, AlertTriangle, CheckCircle, BookOpen, Map, BookMarked
} from "lucide-react";

/**
 * RecommendationPanel - Gợi ý học tập
 * Thiết kế thân thiện với học sinh
 */
export default function RecommendationPanel({ data }) {
    const { weakTopics, strongTopics, recommendedResources, learningPathSuggestion } = data || {};

    const hasData = weakTopics?.length || strongTopics?.length || learningPathSuggestion || recommendedResources?.length;

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-blue-500 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
                    Gợi ý học tập
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">Dựa trên kết quả bài thi của bạn</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
                {/* Strong Topics */}
                {strongTopics?.length > 0 && (
                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                            Điểm mạnh
                        </h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {strongTopics.map((topic, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs sm:text-sm font-medium"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weak Topics */}
                {weakTopics?.length > 0 && (
                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                            Cần ôn tập thêm
                        </h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {weakTopics.map((topic, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs sm:text-sm font-medium"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Learning Path Suggestion */}
                {learningPathSuggestion && (
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-lg sm:rounded-xl">
                        <h4 className="text-xs sm:text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                            <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Lộ trình đề xuất
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {learningPathSuggestion}
                        </p>
                    </div>
                )}

                {/* SMART ROADMAP STEPS - Timeline UI */}
                {data?.roadmapSteps?.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
                        <h4 className="text-sm font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                            <Map className="w-4 h-4" />
                            📍 Lộ trình học tập chi tiết
                        </h4>
                        <div className="space-y-3">
                            {data.roadmapSteps.map((step, index) => (
                                <div key={index} className="flex gap-3 group">
                                    {/* Step number */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                                            {step.stepNumber || index + 1}
                                        </div>
                                        {index < data.roadmapSteps.length - 1 && (
                                            <div className="w-0.5 h-full bg-indigo-200 mt-1"></div>
                                        )}
                                    </div>
                                    {/* Step content */}
                                    <div className="flex-1 pb-4 bg-white rounded-lg p-3 shadow-sm border border-indigo-100 group-hover:shadow-md transition-shadow">
                                        <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                            {step.duration && (
                                                <span className="flex items-center gap-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                                    ⏱️ {step.duration}
                                                </span>
                                            )}
                                            {step.activities && (
                                                <span className="text-indigo-500">📋 {step.activities}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommended Resources */}
                {recommendedResources?.length > 0 && (
                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
                            <BookMarked className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
                            Tài liệu gợi ý
                        </h4>
                        <ul className="space-y-2">
                            {recommendedResources.map((resource, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-100"
                                >
                                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{resource}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Empty State */}
                {!hasData && (
                    <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Chưa có đủ dữ liệu để đưa ra gợi ý</p>
                    </div>
                )}
            </div>
        </div>
    );
}
