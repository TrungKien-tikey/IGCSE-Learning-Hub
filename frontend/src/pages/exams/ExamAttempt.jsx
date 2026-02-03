"use client";

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import examClient from "../../api/examClient";

export default function ExamAttemptPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const examId = params.id;
  const attemptId = searchParams.get("attemptId");
  const accessToken = localStorage.getItem("accessToken");

  // Xóa các khai báo kiểu <Question[]> và <Record...>
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isStrict, setIsStrict] = useState(false);

  const [violationCount, setViolationCount] = useState(0);
  const MAX_VIOLATIONS = 3; // Giới hạn số lần chuyển tab

  const deadlineRef = useRef(0);
  const isInitialized = useRef(false);
  const hasSubmittedRef = useRef(false);

  const STORAGE_KEY = `exam_progress_${attemptId}`;

  // 1. Tải đề thi
  useEffect(() => {
    if (!examId || !attemptId) return;

    examClient.get(`/${examId}`)
      .then(res => {
        const data = res.data;

        const fetchedQuestions = data.questions || [];

        setQuestions(fetchedQuestions);
        setIsStrict(data.isStrict);

        const savedData = localStorage.getItem(STORAGE_KEY);
        let currentDeadline = 0;
        let savedAnswers = {};

        if (savedData) {
          const parsed = JSON.parse(savedData);
          savedAnswers = parsed.answers || {};
          setAnswers(savedAnswers);
          setViolationCount(parsed.violationCount || 0);
          currentDeadline = parsed.deadline;
        } else {
          const durationSeconds = data.duration * 60;
          currentDeadline = Date.now() + (durationSeconds * 1000);

          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            answers: {},
            deadline: currentDeadline,
            violationCount: 0
          }));
        }

        deadlineRef.current = currentDeadline;

        const remaining = Math.floor((currentDeadline - Date.now()) / 1000);

        if (remaining > 0) {
          setTimeLeft(remaining);
          setLoading(false);
        } else {
          if (!hasSubmittedRef.current) {
            setTimeLeft(0);
            toast.info("Thời gian làm bài đã hết. Đang nộp bài...");
            submitImmediately(savedAnswers, fetchedQuestions);
          }
        }

        isInitialized.current = true;
      })
      .catch(err => {
        console.error(err);
        toast.error("Không tải được đề thi hoặc hết phiên đăng nhập");
      });

  }, [examId, accessToken, attemptId]);

  const formatPayload = (currentAnswers, sourceQuestions = questions) => {
    // Nếu sourceQuestions rỗng (do state chưa cập nhật), trả về mảng rỗng
    if (!sourceQuestions || sourceQuestions.length === 0) return [];

    return sourceQuestions.map((q) => {
      const existingAns = currentAnswers[q.questionId];
      if (existingAns) return existingAns;

      return {
        questionId: q.questionId,
        selectedOptionId: null,
        textAnswer: q.questionType === "ESSAY" ? "Để trống" : null,
      };
    });
  };

  const submitImmediately = async (currentAnswers, sourceQuestions) => {
    if (hasSubmittedRef.current) return; // Chặn nộp trùng
    hasSubmittedRef.current = true;

    setLoading(true);

    const finalAnswers = formatPayload(currentAnswers, sourceQuestions);

    try {
      // [4] Dùng examClient.post
      await examClient.post(`/submit`, {
        attemptId: parseInt(attemptId),
        answers: finalAnswers
      });

      localStorage.removeItem(STORAGE_KEY);
      navigate(`/exams/result?attemptId=${attemptId}`);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi khi nộp bài!");
      setLoading(false);
      hasSubmittedRef.current = false;
    }
  };

  // 2. Đếm ngược thời gian
  useEffect(() => {
    if (!isInitialized.current) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((deadlineRef.current - now) / 1000);

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        handleSubmit(); // Hết giờ tự nộp
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isInitialized.current]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isStrict) {
        setViolationCount((prev) => {
          const newCount = prev + 1;

          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              ...parsed,
              violationCount: newCount
            }));
          }

          if (newCount < MAX_VIOLATIONS) {
            toast.warning(`CẢNH BÁO: Bạn đã rời khỏi màn hình thi! (${newCount}/${MAX_VIOLATIONS}).`);
          }
          return newCount;
        });
      }

      if (!document.hidden && deadlineRef.current > 0) {
        const now = Date.now();
        const diff = Math.floor((deadlineRef.current - now) / 1000);
        if (diff <= 0) {
          setTimeLeft(0);
          handleSubmit();
        } else {
          setTimeLeft(diff);
        }
      }

    };

    // Hàm chặn chuột phải
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.warn("Không được sử dụng chuột phải trong bài thi.");
    };

    // Hàm chặn Copy/Paste
    const handleCopyPaste = (e) => {
      e.preventDefault();
      toast.warn("Không được sao chép/dán nội dung trong bài thi.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    // document.addEventListener("blur", handleVisibilityChange); // Có thể thêm blur nếu muốn bắt cả việc click ra ngoài window

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      // document.removeEventListener("blur", handleVisibilityChange);
    };
  }, [isStrict]);

  // --- [MỚI] 6. TỰ ĐỘNG NỘP BÀI KHI VI PHẠM QUÁ MỨC ---
  useEffect(() => {
    if (violationCount >= MAX_VIOLATIONS && !loading && !hasSubmittedRef.current) {
      toast.error("Vi phạm quá nhiều lần. Hệ thống đang thu bài.");
      handleSubmit();
    }
  }, [violationCount]);

  // Xóa : number
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 3. Xử lý khi chọn đáp án (MCQ) hoặc nhập văn bản (Essay)
  // Xóa : number, : string, : any
  const handleAnswerChange = (qId, type, value) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [qId]: {
          questionId: qId,
          selectedOptionId: type === "MCQ" ? value : null,
          textAnswer: type === "ESSAY" ? value : null,
        },
      };

      // --- LƯU VÀO LOCAL STORAGE NGAY LẬP TỨC ---
      // Lấy deadline cũ để không bị ghi đè thời gian
      const savedData = localStorage.getItem(STORAGE_KEY);
      let parsedData = {};

      if (savedData) {
        parsedData = JSON.parse(savedData);
      }

      // [FIX] Giữ lại violationCount cũ khi cập nhật answers
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers: newAnswers,
        deadline: parsedData.deadline || (Date.now() + timeLeft * 1000),
        violationCount: parsedData.violationCount || violationCount // Ưu tiên lấy từ LS để chính xác nhất
      }));

      return newAnswers;
    });
  };

  // 4. Nộp bài
  const handleSubmit = async () => {
    if (!attemptId) return;
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true; // Khóa lại

    if (loading) return;
    setLoading(true);
    // Chuyển đổi object answers thành mảng các câu trả lời
    const finalAnswers = formatPayload(answers);

    try {
      // [5] Dùng examClient.post
      await examClient.post(`/submit`, {
        attemptId: parseInt(attemptId),
        answers: finalAnswers
      });

      localStorage.removeItem(STORAGE_KEY);
      navigate(`/exams/result?attemptId=${attemptId}`);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi khi nộp bài!");
      setLoading(false);
      hasSubmittedRef.current = false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* HEADER CỐ ĐỊNH */}
      <div className="sticky top-0 z-10 bg-white p-4 shadow-md rounded-b-lg flex justify-between items-center mb-6 border-t-4 border-blue-600">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Đang làm bài thi</h1>
          {/* Hiển thị số lần cảnh báo */}
          {violationCount > 0 && (
            <span className="text-xs text-red-600 font-bold animate-pulse">
              Cảnh cáo: {violationCount}/{MAX_VIOLATIONS}
            </span>
          )}
        </div>
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
                    className={`flex items-center p-3 rounded border cursor-pointer transition ${answers[q.questionId]?.selectedOptionId === opt.optionId
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
                  value={answers[q.questionId]?.textAnswer || ""}
                  onChange={(e) => handleAnswerChange(q.questionId, "ESSAY", e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    toast.warning("Không được phép dán nội dung.");
                  }}
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
