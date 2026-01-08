"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import { AnswerState, ExamAttempt, Question } from "../../types";

export default function ExamAttemptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const attemptId = searchParams.get("attemptId");

  // State lưu dữ liệu lượt thi (bao gồm cả đề thi bên trong)
  const [attemptData, setAttemptData] = useState<ExamAttempt | null>(null);
  
  // State lưu câu trả lời
  const [answers, setAnswers] = useState<{ [key: number]: AnswerState }>({});
  
  // State thời gian còn lại (giây)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- KỸ THUẬT USE REF ---
  // Giúp hàm auto-submit lấy được answers mới nhất mà không cần add answers vào dependency của useEffect
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // 1. TẢI DỮ LIỆU TỪ SERVER
  useEffect(() => {
    if (!attemptId) return;

    // Gọi API lấy thông tin lượt thi (để có startTime chuẩn)
    fetch(`http://localhost:8080/api/exams/attempt/${attemptId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi tải lượt làm bài");
        return res.json();
      })
      .then((data: ExamAttempt) => {
        setAttemptData(data);

        // TÍNH TOÁN THỜI GIAN CÒN LẠI
        // Công thức: Deadline = Giờ bắt đầu + Thời lượng bài thi
        const startTime = new Date(data.startTime).getTime();
        const durationMs = data.exam.duration * 60 * 1000; // Đổi phút ra mili giây
        const endTime = startTime + durationMs;
        const now = Date.now();

        const remainingSeconds = Math.floor((endTime - now) / 1000);
        
        // Nếu đã quá giờ thì set về 0
        setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [attemptId]);

  // 2. HÀM XỬ LÝ NỘP BÀI (Dùng useCallback)
  const handleSubmit = useCallback(async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);

    // Lấy dữ liệu từ Ref
    const currentAnswers = answersRef.current;

    const answerPayload = Object.keys(currentAnswers).map((key) => {
      const qId = Number(key);
      const ans = currentAnswers[qId];
      return {
        questionId: qId,
        selectedOptionId: ans.selectedOptionId || null,
        textAnswer: ans.textAnswer || null,
      };
    });

    try {
      const res = await fetch(`http://localhost:8080/api/exams/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: Number(attemptId),
          answers: answerPayload,
        }),
      });

      if (res.ok) {
        router.push(`/exams/result?attemptId=${attemptId}`);
      } else {
        alert("Lỗi khi nộp bài! (Mã lỗi: " + res.status + ")");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Lỗi submit:", error);
      setIsSubmitting(false);
    }
  }, [attemptId, isSubmitting, router]);

  // 3. ĐỒNG HỒ ĐẾM NGƯỢC
  useEffect(() => {
    if (timeLeft === null || isSubmitting) return;

    // HẾT GIỜ -> TỰ ĐỘNG NỘP BÀI
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit, isSubmitting]);

  // Format thời gian hiển thị (MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --- EVENT HANDLERS ---
  const handleOptionChange = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOptionId: optionId },
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], textAnswer: text },
    }));
  };

  const renderQuestionInput = (q: any) => {
    if (q.questionType === "MCQ" && q.options && q.options.length > 0) {
      return (
        <div className="space-y-2 mt-3">
          {q.options.map((opt: any) => {
            const isSelected = answers[q.questionId]?.selectedOptionId === opt.optionId;
            return (
              <label
                key={opt.optionId}
                className={`flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50 transition 
                  ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
              >
                <input
                  type="radio"
                  name={`question-${q.questionId}`}
                  value={opt.optionId}
                  checked={isSelected}
                  onChange={() => handleOptionChange(q.questionId, opt.optionId)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{opt.content}</span>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <textarea
        rows={4}
        className="w-full mt-3 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        placeholder="Nhập câu trả lời tự luận..."
        value={answers[q.questionId]?.textAnswer || ""}
        onChange={(e) => handleTextChange(q.questionId, e.target.value)}
      />
    );
  };

  if (loading) return <div className="p-6 text-center">Đang tải dữ liệu...</div>;
  if (!attemptData) return <div className="p-6 text-center text-red-500">Không tìm thấy bài thi hoặc lỗi server!</div>;

  const { exam } = attemptData;

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20 relative">
      
      {/* THANH ĐỒNG HỒ ĐẾM NGƯỢC (STICKY HEADER) */}
      <div className="sticky top-4 z-50 flex justify-end mb-4 pointer-events-none">
         <div className={`pointer-events-auto px-6 py-3 rounded-lg shadow-lg font-bold text-xl flex items-center gap-2 border-2 transition-colors duration-300
            ${(timeLeft || 0) < 60 
                ? 'bg-red-100 text-red-600 border-red-500 animate-pulse' 
                : 'bg-white text-blue-700 border-blue-600'}
         `}>
            <span>{timeLeft !== null ? formatTime(timeLeft) : "Loading..."}</span>
         </div>
      </div>

      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-700">{exam.title}</h1>
        <p className="text-gray-600 mt-2">{exam.description}</p>
        <div className="mt-2 text-sm text-gray-500">
           Thời gian: {exam.duration} phút
        </div>
      </div>

      <div className="space-y-8">
        {/* --- [FIX QUAN TRỌNG] Kiểm tra mảng questions trước khi map --- */}
        {exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0 ? (
          exam.questions.map((q: any, index: number) => (
            <div key={q.questionId} className="border p-6 rounded-lg shadow-sm bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">
                  Câu {index + 1} <span className="text-sm font-normal text-gray-500">
                    ({q.questionType === 'MCQ' ? 'Trắc nghiệm' : 'Tự luận'} - {q.score} điểm)
                  </span>
                </h3>
              </div>
              
              <p className="text-gray-800 mb-4 font-medium whitespace-pre-line">{q.content}</p>

              {q.image && (
                <div className="mb-4">
                  <img 
                    src={q.image} 
                    alt={`Hình ảnh câu hỏi ${index + 1}`} 
                    className="max-w-full h-auto max-h-96 rounded border border-gray-200 object-contain"
                  />
                </div>
              )}

              {renderQuestionInput(q)}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded bg-gray-50">
             Bài thi này chưa có câu hỏi nào hoặc dữ liệu bị lỗi.
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end sticky bottom-4">
        <button
          onClick={() => handleSubmit()} // Bọc trong arrow function hoặc gọi trực tiếp
          disabled={isSubmitting}
          className={`font-bold py-3 px-8 rounded-lg shadow-lg text-white transition
             ${isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isSubmitting ? "Đang nộp bài..." : "Nộp bài thi"}
        </button>
      </div>
    </div>
  );
}