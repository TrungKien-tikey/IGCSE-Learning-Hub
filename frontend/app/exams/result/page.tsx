"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { ExamAttempt, AnswerState, Exam, Question } from "../types";

export default function ExamResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get("attemptId");

  const [result, setResult] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;

    fetch(`http://localhost:8080/api/exams/attempt/${attemptId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi tải kết quả");
        return res.json();
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) return <div className="p-10 text-center">Đang tính điểm...</div>;
  if (!result) return <div className="p-10 text-center text-red-500">Không tìm thấy kết quả!</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* 1. KẾT QUẢ TỔNG QUAN */}
      <div className="bg-white border rounded-lg shadow-lg p-8 text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Kết quả bài thi</h1>
        <h2 className="text-xl text-blue-600 font-semibold mb-6">{result.exam.title}</h2>
        
        <div className="inline-block p-6 bg-blue-50 rounded-full border-4 border-blue-100">
          <span className="block text-gray-500 text-sm">Tổng điểm</span>
          <span className="text-5xl font-bold text-blue-700">{result.totalScore}</span>
        </div>

        <div className="mt-6">
          <button 
            onClick={() => router.push("/exams")}
            className="text-blue-600 hover:underline"
          >
            ← Quay lại danh sách bài thi
          </button>
        </div>
      </div>

      {/* 2. CHI TIẾT TỪNG CÂU */}
      <h3 className="text-xl font-bold mb-4 text-gray-700">Chi tiết bài làm:</h3>
      <div className="space-y-6">
        {result.answers.map((ans, index) => {
          const q = ans.question;
          
          return (
            <div key={ans.answerId} className="border bg-white p-5 rounded-lg shadow-sm">
              <div className="flex justify-between mb-3">
                <span className="font-bold text-lg">Câu {index + 1}</span>
                <span className={`font-bold px-3 py-1 rounded text-sm 
                  ${ans.score > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {ans.score}/{q.score} điểm
                </span>
              </div>
              
              <p className="mb-4 text-gray-800">{q.content}</p>

              {/* HIỂN THỊ TRẮC NGHIỆM */}
              {q.questionType === "MCQ" && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    // Logic tô màu:
                    // - Nếu user chọn đáp án này: Có viền đậm
                    // - Nếu đây là đáp án ĐÚNG (isCorrect=true): Nền xanh lá
                    // - Nếu User chọn SAI (isSelected nhưng !isCorrect): Nền đỏ
                    
                    console.log("So sánh:", ans.selectedOptionId, " (" + typeof ans.selectedOptionId + ") vs ", opt.optionId, " (" + typeof opt.optionId + ")");
                    const isSelected = String(ans.selectedOptionId) === String(opt.optionId);
                    const isCorrect = opt.isCorrect;

                    let className = "p-3 border rounded flex justify-between items-center ";
                    
                    if (isSelected && isCorrect) {
                      className += "bg-green-100 border-green-500 text-green-800"; // Chọn đúng
                    } else if (isSelected && !isCorrect) {
                      className += "bg-red-100 border-red-500 text-red-800"; // Chọn sai
                    } else if (!isSelected && isCorrect) {
                       // Hiện đáp án đúng cho user biết (tuỳ chọn)
                      className += "bg-green-50 border-green-200 text-green-700 opacity-70";
                    } else {
                      className += "bg-gray-50 border-gray-200 opacity-50"; // Các câu khác
                    }

                    return (
                      <div key={opt.optionId} className={className}>
                        <span>{opt.content}</span>
                        {isSelected && <span className="text-sm font-bold">(Bạn chọn)</span>}
                        {!isSelected && isCorrect && <span className="text-sm">(Đáp án đúng)</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* HIỂN THỊ TỰ LUẬN */}
              {q.questionType === "ESSAY" && (
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm text-gray-500 mb-1">Câu trả lời của bạn:</p>
                  <p className="text-gray-800 whitespace-pre-line">
                    {ans.textAnswer || "Chưa trả lời"}
                  </p>
                  <p className="text-sm text-yellow-600 mt-2 italic">
                    * Câu tự luận cần giáo viên chấm điểm.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}