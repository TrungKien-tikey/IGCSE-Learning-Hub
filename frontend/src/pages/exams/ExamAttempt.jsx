"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// Đã xóa interface Question và UserAnswer vì JS không cần

export default function ExamAttemptPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  
  const examId = params.id;
  const attemptId = searchParams.get("attemptId");

  // Xóa các khai báo kiểu <Question[]> và <Record...>
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [loading, setLoading] = useState(false);

  // 1. Tải đề thi
  useEffect(() => {
    if (!examId) return;
    
    fetch(`/api/exams/${examId}`)
      .then(res => res.json())
      .then(data => {
         setTimeLeft(data.duration * 60); 
         setQuestions(data.questions || []);
      })
      .catch(err => console.error(err));
  }, [examId]);

  // 2. Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Hết giờ tự nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Xóa : number
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 3. Xử lý khi chọn đáp án (MCQ) hoặc nhập văn bản (Essay)
  // Xóa : number, : string, : any
  const handleAnswerChange = (qId, type, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        questionId: qId,
        selectedOptionId: type === "MCQ" ? value : null,
        textAnswer: type === "ESSAY" ? value : null,
      },
    }));
  };

  // 4. Nộp bài
  const handleSubmit = async () => {
    if (!attemptId) return;
    setLoading(true);

    // Chuyển đổi object answers thành mảng các câu trả lời
    const answerList = Object.values(answers);

    try {
        const res = await fetch(`/api/exams/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // SỬA TẠI ĐÂY: Thay vì gửi trực tiếp answerList, hãy bọc nó lại
            body: JSON.stringify({
                attemptId: parseInt(attemptId), // Lấy từ URL params
                answers: answerList             // Danh sách câu trả lời
            }),
        });

        if (!res.ok) throw new Error("Nộp bài thất bại");
        navigate(`/exams/result?attemptId=${attemptId}`);
    } catch (error) {
        console.error(error);
        alert("Có lỗi khi nộp bài!");
        setLoading(false);
    }
};

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* HEADER CỐ ĐỊNH */}
      <div className="sticky top-0 z-10 bg-white p-4 shadow-md rounded-b-lg flex justify-between items-center mb-6 border-t-4 border-blue-600">
        <h1 className="text-xl font-bold text-gray-800">Đang làm bài thi</h1>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
           ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((q, index) => (
          <div key={q.questionId} className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                Câu {index + 1}
              </span> 
              {q.content} 
              <span className="text-sm text-gray-500 font-normal ml-2">({q.score} điểm)</span>
            </h3>

            {q.image && (
                <img src={q.image} alt="Minh họa" className="mb-4 max-h-60 object-contain rounded border" />
            )}

            {/* HIỂN THỊ DỰA THEO LOẠI CÂU HỎI */}
            {q.questionType === "MCQ" ? (
              // --- TRẮC NGHIỆM ---
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <label
                    key={opt.optionId}
                    className={`flex items-center p-3 rounded border cursor-pointer transition ${
                      answers[q.questionId]?.selectedOptionId === opt.optionId
                        ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.questionId}`}
                      value={opt.optionId}
                      checked={answers[q.questionId]?.selectedOptionId === opt.optionId}
                      onChange={() => handleAnswerChange(q.questionId, "MCQ", opt.optionId)}
                      className="h-5 w-5 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">{opt.content}</span>
                  </label>
                ))}
              </div>
            ) : (
              // --- TỰ LUẬN ---
              <div className="mt-2">
                 <textarea
                    rows={5}
                    placeholder="Nhập câu trả lời của bạn vào đây..."
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => handleAnswerChange(q.questionId, "ESSAY", e.target.value)}
                 ></textarea>
                 <p className="text-xs text-gray-500 mt-2 italic">
                    * Câu hỏi này sẽ được chấm điểm tự động bởi AI sau khi nộp bài.
                 </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-full shadow-lg transition transform hover:scale-105"
        >
          {loading ? "Đang nộp bài..." : "NỘP BÀI THI"}
        </button>
      </div>
    </div>
  );
}
