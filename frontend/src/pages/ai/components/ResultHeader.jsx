import { Globe, Cpu } from "lucide-react";
import { getMethodColor, getEvaluationMethodLabel } from "../utils/format";

/**
 * ResultHeader - Header hiển thị thông tin attempt
 * Sử dụng lucide-react icons
 */
export default function ResultHeader({ result }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Kết quả chấm điểm #{result.attemptId}
                </h1>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    Ngôn ngữ: <span className="font-medium text-slate-700">{result.language || "auto"}</span>
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Evaluation Method Badge */}
                <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${getMethodColor(
                        result.evaluationMethod
                    )}`}
                >
                    <Cpu className="w-4 h-4" />
                    {getEvaluationMethodLabel(result.evaluationMethod)}
                </span>
            </div>
        </div>
    );
}
