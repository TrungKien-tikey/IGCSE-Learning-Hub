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
        w-full flex items-center justify-between p-4 rounded-xl
        transition-colors duration-200
        ${openSections[id]
                    ? 'bg-slate-50'
                    : 'hover:bg-slate-50'
                }
      `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <span className="font-semibold text-slate-800">{title}</span>
                {count !== undefined && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-medium">
                        {count}
                    </span>
                )}
            </div>
            <div className={`transition-transform duration-200 ${openSections[id] ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-slate-400" />
            </div>
        </button>
    );

    const AccordionContent = ({ id, children }) => (
        <div
            className={`
        overflow-hidden transition-all duration-300 ease-out
        ${openSections[id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
      `}
        >
            <div className="px-4 pb-4 pt-2">
                {children}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header - màu teal thân thiện */}
            <div className="bg-teal-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Insights
                </h3>
                <p className="text-teal-100 text-sm mt-1">Phân tích và gợi ý từ AI</p>
            </div>

            {/* Accordion Sections */}
            <div className="p-4 space-y-2">
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
                            <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
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
                                        className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg"
                                    >
                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-slate-700">{strength}</span>
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
                                        className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg"
                                    >
                                        <XCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-slate-700">{area}</span>
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
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
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
