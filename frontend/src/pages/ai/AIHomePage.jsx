import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, FileText, BarChart3, ArrowRight, Home, AlertTriangle } from "lucide-react";

/**
 * AIHomePage - Trang chủ AI module
 * Sử dụng lucide-react icons và màu sắc Material 3 style
 */
export default function AIHomePage() {
    const navigate = useNavigate();
    const [attemptId, setAttemptId] = useState("");
    const [studentId, setStudentId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleViewResult = async (e) => {
        e.preventDefault();
        if (!attemptId.trim()) {
            setError("Vui lòng nhập Attempt ID");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8082/api/ai";
            const res = await fetch(`${aiServiceUrl}/result/${attemptId}`);
            if (!res.ok) {
                throw new Error("Không tìm thấy kết quả với Attempt ID này");
            }
            navigate(`/ai/results/${attemptId}`);
        } catch (err) {
            setError(err.message || "Đã xảy ra lỗi");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDashboard = () => {
        if (!studentId.trim()) {
            setError("Vui lòng nhập Student ID");
            return;
        }
        navigate(`/ai/dashboard/student?studentId=${studentId}`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">AI Grading</h1>
                            <p className="text-sm text-slate-500">Kết quả chấm điểm thông minh</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-6">
                {/* Hero Section */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-3">
                        AI Grading System
                    </h1>
                    <p className="text-slate-600 max-w-xl mx-auto">
                        Xem kết quả chấm điểm chi tiết từ AI hoặc truy cập dashboard thống kê học tập của bạn
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Card 1: Xem kết quả */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800">Xem kết quả bài thi</h2>
                        </div>
                        <p className="text-slate-600 text-sm mb-4">
                            Nhập Attempt ID để xem chi tiết kết quả chấm điểm từng câu hỏi
                        </p>

                        <form onSubmit={handleViewResult}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Attempt ID
                                </label>
                                <input
                                    type="number"
                                    value={attemptId}
                                    onChange={(e) => setAttemptId(e.target.value)}
                                    placeholder="Ví dụ: 1"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-slate-800 placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        Đang kiểm tra...
                                    </>
                                ) : (
                                    <>
                                        Xem kết quả
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Card 2: Dashboard */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800">Dashboard học sinh</h2>
                        </div>
                        <p className="text-slate-600 text-sm mb-4">
                            Xem thống kê tổng quan và gợi ý học tập cá nhân hóa
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Student ID
                            </label>
                            <input
                                type="number"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                placeholder="Ví dụ: 1"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white text-slate-800 placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <button
                            onClick={handleViewDashboard}
                            className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                        >
                            Mở Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Quick Links */}
                <div className="mt-10 text-center">
                    <p className="text-sm text-slate-500 mb-3">Liên kết nhanh</p>
                    <div className="flex justify-center gap-4">
                        <a href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1.5 transition">
                            <Home className="w-4 h-4" />
                            Trang chủ
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
