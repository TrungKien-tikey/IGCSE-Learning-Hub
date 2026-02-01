import { useState } from "react";
import {
    Sparkles, FileText, AlertTriangle, Target, ChevronDown,
    CheckCircle, XCircle
} from "lucide-react";

/**
 * InsightCard Component với Accordion sections
 * Header màu xanh teal thân thiện hơn
 */
export default function InsightCard({ insight }) {
    const [openSections, setOpenSections] = useState({
        summary: true,
        strengths: false,
        improvements: false,
        action: false,
    });

    if (!insight) {
        return null;
    }

    const { overallSummary, keyStrengths, areasForImprovement, actionPlan } = insight;

    const toggleSection = (section) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const AccordionHeader = ({ id, title, icon: Icon, iconBg, iconColor, count }) => (
        <button
            onClick={() => toggleSection(id)}
            className={`
        w-full flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl
        transition-colors duration-200
        ${openSections[id]
                    ? 'bg-slate-50'
                    : 'hover:bg-slate-50'
                }
      `}
        >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
                </div>
                <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">{title}</span>
                {count !== undefined && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-medium flex-shrink-0">
                        {count}
                    </span>
                )}
            </div>
            <div className={`transition-transform duration-200 flex-shrink-0 ${openSections[id] ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </div>
        </button>
    );

    const AccordionContent = ({ id, children }) => (
        <div
            className={`
        overflow-hidden transition-all duration-300 ease-out
        ${openSections[id] ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
      `}
        >
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
                {children}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Header - màu teal thân thiện */}
            <div className="bg-teal-500 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    AI Insights
                </h3>
                <p className="text-teal-100 text-xs sm:text-sm mt-1">Phân tích và gợi ý từ AI</p>
            </div>

            {/* Accordion Sections */}
            <div className="p-3 sm:p-4 space-y-2 flex-1 overflow-y-auto">
                {/* Overall Summary */}
                {overallSummary && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <AccordionHeader
                            id="summary"
                            title="Nhận xét tổng quan"
                            icon={FileText}
                            iconBg="bg-teal-100"
                            iconColor="text-teal-600"
                        />
                        <AccordionContent id="summary">
                            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 sm:p-4">
                                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                                    {overallSummary}
                                </p>
                            </div>
                        </AccordionContent>
                    </div>
                )}

                {/* Key Strengths */}
                {keyStrengths?.length > 0 && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <AccordionHeader
                            id="strengths"
                            title="Điểm mạnh"
                            icon={CheckCircle}
                            iconBg="bg-emerald-100"
                            iconColor="text-emerald-600"
                            count={keyStrengths.length}
                        />
                        <AccordionContent id="strengths">
                            <div className="space-y-2">
                                {keyStrengths.map((strength, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-2 p-2 sm:p-3 bg-emerald-50 border border-emerald-100 rounded-lg"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{strength}</span>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </div>
                )}

                {/* Areas for Improvement */}
                {areasForImprovement?.length > 0 && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <AccordionHeader
                            id="improvements"
                            title="Cần cải thiện"
                            icon={AlertTriangle}
                            iconBg="bg-amber-100"
                            iconColor="text-amber-600"
                            count={areasForImprovement.length}
                        />
                        <AccordionContent id="improvements">
                            <div className="space-y-2">
                                {areasForImprovement.map((area, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-2 p-2 sm:p-3 bg-amber-50 border border-amber-100 rounded-lg"
                                    >
                                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{area}</span>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </div>
                )}

                {/* Action Plan */}
                {actionPlan && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <AccordionHeader
                            id="action"
                            title="Kế hoạch hành động"
                            icon={Target}
                            iconBg="bg-blue-100"
                            iconColor="text-blue-600"
                        />
                        <AccordionContent id="action">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
                                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                                    {actionPlan}
                                </p>
                            </div>
                        </AccordionContent>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {!overallSummary && !keyStrengths?.length && !areasForImprovement?.length && !actionPlan && (
                <div className="p-8 text-center">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Chưa có đủ dữ liệu để phân tích</p>
                </div>
            )}
        </div>
    );
}
