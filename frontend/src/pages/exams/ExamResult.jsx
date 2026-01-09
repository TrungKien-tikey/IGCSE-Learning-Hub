"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ExamResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const attemptId = searchParams.get("attemptId");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchResult = (showLoading = true) => {
        if (showLoading) setIsRefreshing(true);

        fetch(`http://localhost:8080/api/exams/attempt/${attemptId}`)
            .then((res) => res.json())
            .then((data) => {
                setResult(data);
                setLoading(false);
                setIsRefreshing(false);
            })
            .catch((err) => {
                console.error("Lỗi fetch:", err);
                setLoading(false);
                setIsRefreshing(false);
            });
    };

    useEffect(() => {
        if (attemptId) fetchResult(false);
    }, [attemptId]);

    // Kiểm tra trạng thái chấm điểm (Dựa trên score = 0 và loại ESSAY)
    const hasPendingEssay = result?.answers?.some(
        (a) => a.question.questionType === "ESSAY" && !a.feedback // Chưa có feedback -> Đang chấm
            || (a.question.questionType === "ESSAY" && a.feedback === "Đang chấm điểm...")
    ) || false;

    // Auto-polling: Tự động cập nhật mỗi 3s nếu đang chấm
    useEffect(() => {
        if (!hasPendingEssay) return;

        console.log("⏳ Đang chờ AI chấm điểm... Polling...");
        const interval = setInterval(() => {
            fetchResult(false);
        }, 3000);

        return () => clearInterval(interval);
    }, [hasPendingEssay]);

    if (loading) return <div className="p-10 text-center text-gray-500">Đang tải kết quả...</div>;
    if (!result) return <div className="p-10 text-center text-red-500">Không tìm thấy kết quả.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 pb-20">
            {/* CARD TỔNG QUAN */}
            <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 text-center border-t-8 border-indigo-600">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                    ID Lượt làm: #{result.attemptId}
                </span>
                <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-2">Kết quả bài thi</h1>
                <h2 className="text-xl text-indigo-600 mb-6 font-semibold">
                    {result.exam?.title || "N/A"}
                </h2>

                <div className="flex justify-center items-center gap-8 mb-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 uppercase tracking-widest">Tổng điểm</p>
                        <div className="text-6xl font-black text-indigo-600 mt-2">
                            {result.totalScore}
                        </div>
                    </div>
                </div>

                {hasPendingEssay && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-amber-700 text-sm flex items-center justify-center gap-2 font-medium">
                            <span className="animate-bounce">⏳</span> AI đang chấm điểm các câu tự luận...
                        </p>
                        <button
                            onClick={() => fetchResult(true)}
                            disabled={isRefreshing}
                            className="mt-3 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all shadow-md disabled:bg-gray-300"
                        >
                            {isRefreshing ? "Đang cập nhật..." : "🔄 Cập nhật điểm ngay"}
                        </button>
                    </div>
                )}

                <div className="flex justify-center gap-4 border-t pt-6">
                    <button
                        onClick={() => navigate("/exams")}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                        Về trang chủ
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-semibold"
                    >
                        In kết quả
                    </button>
                </div>
            </div>

            {/* CHI TIẾT CÂU TRẢ LỜI */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    📑 Chi tiết bài làm
                </h3>

                {result.answers?.map((ans, index) => {
                    const q = ans.question;
                    const isEssay = q.questionType === "ESSAY";
                    const isCorrect = ans.score > 0;
                    const isPending = isEssay && ans.score === 0 && !ans.feedback;

                    return (
                        <div key={ans.answerId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                            {/* Header câu hỏi */}
                            <div className={`p-4 flex justify-between items-center ${isCorrect ? 'bg-green-50' : isPending ? 'bg-amber-50' : 'bg-red-50'}`}>
                                <span className="font-bold text-gray-700">Câu {index + 1}</span>
                                <span className="text-sm font-bold bg-white px-3 py-1 rounded-full shadow-sm border">
                                    {ans.score} / {q.score} điểm
                                </span>
                            </div>

                            <div className="p-5">
                                {/* Nội dung chữ của câu hỏi */}
                                <p className="text-lg text-gray-800 font-medium mb-4">{q.content}</p>

                                {/* HIỂN THỊ HÌNH ẢNH CỦA CÂU HỎI (Nếu có) */}
                                {q.image && (
                                    <div className="mb-6 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 flex justify-center">
                                        <img
                                            src={q.image}
                                            alt={`Hình ảnh câu hỏi ${index + 1}`}
                                            className="max-h-80 object-contain hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                            onClick={() => window.open(q.image, '_blank')} // Click để xem ảnh gốc
                                        />
                                    </div>
                                )}

                                {/* PHẦN TRẮC NGHIỆM (MCQ) */}
                                {!isEssay && q.options && (
                                    <div className="space-y-2 mb-4">
                                        {q.options.map((opt) => {
                                            const isSelected = opt.optionId === ans.selectedOptionId;
                                            const isRightOption = opt.isCorrect;

                                            let borderClass = "border-gray-200";
                                            let icon = "⚪";

                                            if (isSelected) {
                                                borderClass = isRightOption ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50";
                                                icon = isRightOption ? "✅" : "❌";
                                            } else if (isRightOption) {
                                                borderClass = "border-green-500 border-dashed bg-green-50/30";
                                                icon = "✔️";
                                            }

                                            return (
                                                <div key={opt.optionId} className={`flex items-center p-3 border-2 rounded-lg transition-all ${borderClass}`}>
                                                    <span className="mr-3">{icon}</span>
                                                    <span className={`flex-1 ${isSelected ? 'font-bold' : ''}`}>
                                                        {opt.content}
                                                    </span>
                                                    {isSelected && <span className="text-xs font-bold uppercase ml-2 text-gray-400">(Bạn chọn)</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* PHẦN TỰ LUẬN (ESSAY) */}
                                {isEssay && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bài làm của bạn:</p>
                                        <p className="text-gray-700 whitespace-pre-wrap italic">
                                            {ans.textAnswer || "Không có câu trả lời"}
                                        </p>
                                    </div>
                                )}

                                {/* NHẬN XÉT VÀ FEEDBACK */}
                                <div className={`mt-4 p-4 rounded-lg flex gap-3 ${isCorrect ? 'bg-green-100/50' : isPending ? 'bg-amber-100/50' : 'bg-red-100/50'}`}>
                                    <span className="text-xl">💬</span>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Nhận xét từ {isEssay ? 'AI Grading' : 'Hệ thống'}:</p>
                                        <p className={`text-sm font-medium ${isCorrect ? 'text-green-700' : isPending ? 'text-amber-700' : 'text-red-700'}`}>
                                            {isPending ? "Đang phân tích câu trả lời..." : (ans.feedback || (isCorrect ? "Câu trả lời hoàn toàn chính xác." : "Rất tiếc, câu trả lời chưa đúng."))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}