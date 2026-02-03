"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FaRobot, FaUserGraduate, FaCheckCircle, FaSave, FaArrowRight, FaArrowLeft, FaList, FaHistory } from "react-icons/fa";
import MainLayout from '../../layouts/MainLayout';
import examClient from "../../api/examClient";
import axiosClient from "../../api/axiosClient";

export default function TeacherGradingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = localStorage.getItem("accessToken");

  // --- STATE ---
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // State điều hướng câu hỏi
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [essayAnswers, setEssayAnswers] = useState([]);

  // State form chấm điểm
  const [manualScore, setManualScore] = useState(0);
  const [teacherFeedback, setTeacherFeedback] = useState("");

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    if (location.state?.targetAttemptId) {
      setIsFocusMode(true);
      fetchSpecificAttempt(location.state.targetAttemptId);
    } else {
      setIsFocusMode(false);
      fetchPendingGrading();
    }
  }, [accessToken, location.state]);

  const fetchSpecificAttempt = async (attemptId) => {
    try {
      const res = await examClient.get(`/attempt/${attemptId}`);
      processAttemptData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi: " + (err.response?.data?.message || err.message));
      setIsFocusMode(false);
      fetchPendingGrading();
    }
  };

  const fetchPendingGrading = async () => {
    try {
      const res = await examClient.get("/grading/pending");
      setPendingAttempts(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) return navigate("/login");
      toast.error("Lỗi tải danh sách chấm thi");
    }
  };

  const fetchStudentName = async (userId) => {
    try {
      const res = await axiosClient.get(`/api/v1/auth/users/${userId}`, { baseURL: '' });
      if (res.status === 200) {
        const userData = res.data;
        return userData.full_name || userData.fullName || userData.email;
      }
    } catch (error) {
      console.error("Lỗi lấy tên học sinh:", error);
    }
    return null;
  };

  // --- [FIX QUAN TRỌNG TẠI ĐÂY] ---
  const processAttemptData = async (attempt) => {
    let studentName = attempt.studentName;
    if (!studentName && attempt.userId) {
      studentName = await fetchStudentName(attempt.userId);
    }
    // Gán tên vào object (nếu lỗi API thì dùng User ID làm fallback)
    const attemptWithProfile = {
      ...attempt,
      studentName: studentName || `User #${attempt.userId}`
    };

    setSelectedAttempt(attemptWithProfile);

    const essays = attempt.answers?.filter(a =>
      a.question?.questionType === 'ESSAY' ||
      (a.textAnswer !== undefined && a.textAnswer !== null)
    ).map(a => {
      // Logic suy luận: Nếu có teacherFeedback từ DB thì coi như đã chấm thủ công
      // Điều này giúp giữ trạng thái "Đã chấm" khi load lại trang
      const hasGraded = a.isManuallyGraded === true || (a.teacherFeedback !== null && a.teacherFeedback !== "");

      return {
        ...a,
        isManuallyGraded: hasGraded
      };
    }) || [];

    setEssayAnswers(essays);
    setCurrentQuestionIndex(0);

    if (essays.length > 0) {
      loadFormData(essays[0]);
    } else {
      toast.info("Bài này không có câu tự luận nào.");
    }
  };

  const handleSelectAttempt = (attempt) => {
    processAttemptData(attempt);
  };

  // Nạp dữ liệu vào form (Ưu tiên điểm đã chấm, nếu chưa chấm thì lấy điểm AI)
  const loadFormData = (answer) => {
    // Vì ở trên đã xử lý isManuallyGraded rồi, nên ở đây logic sẽ chạy đúng
    const initialScore = answer.isManuallyGraded ? answer.score : (answer.aiScore || 0);
    const initialFeedback = answer.isManuallyGraded ? answer.feedback : (answer.aiFeedback || ""); // Lấy feedback hiện tại (ưu tiên teacherFeedback nếu có)

    setManualScore(initialScore);
    setTeacherFeedback(initialFeedback);
  };

  const handleNavigateQuestion = (direction) => {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < essayAnswers.length) {
      setCurrentQuestionIndex(newIndex);
      loadFormData(essayAnswers[newIndex]);
    }
  };

  const handleAcceptAI = () => {
    const currentAnswer = essayAnswers[currentQuestionIndex];
    setManualScore(currentAnswer.aiScore || 0);
    setTeacherFeedback(currentAnswer.aiFeedback || "");
    toast.info("Đã áp dụng kết quả từ AI, hãy nhấn Lưu.");
  };

  const handleSaveGrade = async () => {
    const currentAnswer = essayAnswers[currentQuestionIndex];
    try {
      const payload = {
        attemptId: selectedAttempt.attemptId,
        answerId: currentAnswer.answerId,
        score: Number(manualScore),
        feedback: teacherFeedback
      };

      await examClient.post("/grading/update", payload);

      toast.success("Đã lưu điểm thành công!");

      // Update state local
      const updatedAnswers = [...essayAnswers];
      updatedAnswers[currentQuestionIndex] = {
        ...currentAnswer,
        score: manualScore,
        feedback: teacherFeedback,
        teacherFeedback: teacherFeedback,
        isManuallyGraded: true,
        lastEditedAt: new Date().toISOString()
      };
      setEssayAnswers(updatedAnswers);

      if (currentQuestionIndex < essayAnswers.length - 1) {
        handleNavigateQuestion(1);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Lỗi khi lưu điểm";
      toast.error(msg);
    }
  };

  const currentAnswer = essayAnswers[currentQuestionIndex];

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-100px)] gap-4 transition-all">

        {/* === SIDEBAR === */}
        {!isFocusMode && (
          <div className="w-1/4 bg-white rounded-lg shadow border overflow-y-auto animate-fade-in-left">
            <div className="p-4 bg-gray-50 border-b sticky top-0 z-10 flex justify-between items-center">
              <h2 className="font-bold text-gray-700">Chờ duyệt ({pendingAttempts.length})</h2>
              <FaList className="text-gray-400" />
            </div>
            <ul>
              {pendingAttempts.map((attempt) => (
                <li
                  key={attempt.attemptId}
                  onClick={() => handleSelectAttempt(attempt)}
                  className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition
                    ${selectedAttempt?.attemptId === attempt.attemptId ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                >
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <FaUserGraduate className="text-gray-500" />
                    User ID: {attempt.userId}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {attempt.exam?.title || "Bài kiểm tra"}
                  </div>
                  <div className="mt-2 text-xs text-orange-600 bg-orange-100 inline-block px-2 py-1 rounded">
                    {attempt.gradingStatus}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* === MAIN CONTENT === */}
        <div className={`flex flex-col bg-white rounded-lg shadow border overflow-hidden ${isFocusMode ? 'w-full' : 'flex-1'}`}>

          {selectedAttempt && currentAnswer ? (
            <>
              {/* Toolbar */}
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <div className="flex-col items-center gap-4 dir">
                  {isFocusMode && (
                    <button
                      onClick={() => navigate(-1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 px-3 py-1 border rounded bg-white hover:bg-blue-50 transition"
                    >
                      <FaArrowLeft /> Quay lại
                    </button>
                  )}

                  <div className="pt-4">
                    <h3 className="font-bold text-lg text-gray-800">
                      Câu {currentQuestionIndex + 1} / {essayAnswers.length}
                    </h3>
                    {isFocusMode && <span className="text-xs text-blue-600 font-medium">Đang chấm: {selectedAttempt.studentName || `User #${selectedAttempt.userId}`}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleNavigateQuestion(-1)} disabled={currentQuestionIndex === 0} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-90"><FaArrowLeft /></button>
                  <button onClick={() => handleNavigateQuestion(1)} disabled={currentQuestionIndex === essayAnswers.length - 1} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-90"><FaArrowRight className="inline ml-1" /></button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">

                {/* CỘT GIỮA: NỘI DUNG */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Câu hỏi</span>
                    <div className="mt-2 text-gray-800 font-medium text-lg">
                      {currentAnswer.question?.content}
                    </div>
                    {currentAnswer.question?.image && (
                      <div className="mt-3"><img src={currentAnswer.question.image} alt="Question" className="max-h-64 rounded border" /></div>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-200 min-h-[200px]">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      Bài làm của sinh viên
                    </span>
                    <div className="mt-3 text-gray-800 whitespace-pre-wrap leading-relaxed p-3 bg-blue-50 rounded">
                      {currentAnswer.textAnswer || <span className="text-gray-400 italic">(Bỏ trống)</span>}
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: FORM CHẤM ĐIỂM */}
                <div className="w-[400px] bg-white border-l p-6 overflow-y-auto flex flex-col gap-6">

                  {/* AI Suggestion */}
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-purple-800 flex items-center gap-2">AI gợi ý chấm điểm</h4>
                      <div className="text-2xl font-bold text-purple-600">{currentAnswer.aiScore}<span className="text-sm text-gray-400"> điểm</span></div>
                    </div>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded border border-purple-100 italic">"{currentAnswer.aiFeedback || "Không có nhận xét"}"</p>
                    <button onClick={handleAcceptAI} className="mt-3 w-full py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition text-sm shadow-sm">Dùng kết quả này</button>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Teacher Input */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        Kết quả chính thức
                      </h4>

                      {currentAnswer.isManuallyGraded ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold border border-green-200 flex items-center gap-1">
                          <FaHistory size={10} /> Đã lưu: {currentAnswer.score} điểm
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium border border-gray-200">
                          Chưa chấm
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Điểm số</label>
                        <input
                          type="number"
                          value={manualScore}
                          onChange={(e) => setManualScore(e.target.value)}
                          className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-xl text-center text-green-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét của bạn</label>
                        <textarea
                          rows={5}
                          value={teacherFeedback}
                          onChange={(e) => setTeacherFeedback(e.target.value)}
                          placeholder="Nhập nhận xét chi tiết..."
                          className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                        ></textarea>
                      </div>

                      <button onClick={handleSaveGrade} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-md flex justify-center items-center gap-2">
                        Lưu
                      </button>

                      {currentAnswer.isManuallyGraded && (
                        <p className="text-center text-xs text-green-600 font-medium">
                          Đã lưu lần cuối lúc {new Date(currentAnswer.lastEditedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FaUserGraduate size={48} className="mb-4 text-gray-300" />
              <p>{isFocusMode ? "Đang tải dữ liệu bài thi..." : "Chọn một bài thi từ danh sách bên trái để bắt đầu chấm."}</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}