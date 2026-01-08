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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Gợi ý học tập
                </h3>
                <p className="text-blue-100 text-sm mt-1">Dựa trên kết quả bài thi của bạn</p>
            </div>

            <div className="p-6 space-y-5">
                {/* Strong Topics */}
                {strongTopics?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Điểm mạnh
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {strongTopics.map((topic, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium"
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
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Cần ôn tập thêm
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {weakTopics.map((topic, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-medium"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Learning Path Suggestion */}
                {learningPathSuggestion && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                            <Map className="w-4 h-4" />
                            Lộ trình đề xuất
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {learningPathSuggestion}
                        </p>
                    </div>
                )}

                {/* Recommended Resources */}
                {recommendedResources?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <BookMarked className="w-4 h-4 text-violet-500" />
                            Tài liệu gợi ý
                        </h4>
                        <ul className="space-y-2">
                            {recommendedResources.map((resource, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                                >
                                    <BookOpen className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">{resource}</span>
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
