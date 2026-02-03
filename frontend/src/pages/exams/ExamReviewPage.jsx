"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaRobot } from "react-icons/fa";
import MainLayout from '../../layouts/MainLayout';
import examClient from "../../api/examClient"

export default function ExamReviewPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    const fetchAttemptDetail = async () => {
      try {
        const res = await examClient.get(`/attempt/${attemptId}`);
        setAttempt(res.data);
      } catch (err) {
        console.error("Lỗi tải chi tiết bài làm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttemptDetail();
  }, [attemptId, accessToken, navigate]);

  if (loading) return <div className="p-10 text-center">Đang tải chi tiết bài làm...</div>;
  if (!attempt) return <div className="p-10 text-center text-red-500">Không tìm thấy bài làm!</div>;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4">
        {/* HEADER: KẾT QUẢ TỔNG QUAN */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-blue-600 mb-4 transition"
          >
            <FaArrowLeft className="mr-2" /> Quay lại danh sách
          </button>

          <h1 className="text-2xl font-bold text-gray-800 text-center">{attempt.exam?.title}</h1>
          <div className="flex gap-6 mt-4 border-t pt-4 justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Tổng điểm</p>
              <p className={`text-2xl font-bold ${attempt.totalScore >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                {attempt.totalScore} điểm
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày nộp</p>
              <p className="text-lg font-medium text-gray-700">
                {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="bg-orange-50 px-3 py-1 rounded border border-orange-200">
              <p className="text-sm text-orange-600 font-bold">Lưu ý</p>
              <p className="text-xs text-orange-500">Điểm số có thể thay đổi nếu AI chấm sai</p>
            </div>
          </div>
        </div>

        {/* DANH SÁCH CÂU HỎI & TRẢ LỜI */}
        <div className="space-y-6">
          {attempt.answers?.map((ans, index) => {
            const question = ans.question;
            const isEssay = question.questionType === "ESSAY";

            // Logic màu sắc cho trắc nghiệm
            let statusColor = "border-gray-200";
            if (!isEssay) {
              if (ans.score > 0) statusColor = "border-green-500 bg-green-50"; // Đúng
              else statusColor = "border-red-500 bg-red-50"; // Sai
            }

            return (
              <div key={ans.answerId} className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${statusColor}`}>
                {/* Nội dung câu hỏi */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">
                      Câu {index + 1}: <span className="font-normal">{question.content}</span>
                    </h3>

                    {/* --- [MỚI] HIỂN THỊ HÌNH ẢNH NẾU CÓ --- */}
                    {question.image && (
                      <div className="mt-3 mb-2">
                        <img
                          src={question.image}
                          alt={`Minh họa câu ${index + 1}`}
                          className="max-h-64 max-w-full rounded-lg border border-gray-200 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold ml-4 whitespace-nowrap">
                    {ans.score} điểm
                  </span>
                </div>

                {/* --- HIỂN THỊ CHO TRẮC NGHIỆM --- */}
                {!isEssay && (
                  <div className="space-y-2 ml-4">
                    {question.options?.map((opt) => {
                      const isSelected = ans.selectedOptionId === opt.optionId;
                      const isCorrect = opt.isCorrect;

                      let optClass = "p-3 border rounded-lg flex justify-between items-center ";

                      if (isSelected && isCorrect) optClass += "bg-green-100 border-green-500 text-green-800";
                      else if (isSelected && !isCorrect) optClass += "bg-red-100 border-red-500 text-red-800";
                      else if (!isSelected && isCorrect) optClass += "bg-green-50 border-green-300 text-green-700 opacity-70";
                      else optClass += "bg-white text-gray-600 opacity-50";

                      return (
                        <div key={opt.optionId} className={optClass}>
                          <span>{opt.content}</span>
                          {isSelected && isCorrect && <FaCheckCircle className="text-green-600" />}
                          {isSelected && !isCorrect && <FaTimesCircle className="text-red-600" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* --- HIỂN THỊ CHO TỰ LUẬN --- */}
                {isEssay && (
                  <div className="ml-4 space-y-4">
                    {/* Bài làm của học sinh */}
                    <div className="bg-blue-50 p-4 rounded border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 mb-1">Bài làm của bạn:</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{ans.textAnswer}</p>
                    </div>

                    {/* AI Feedback */}
                    {ans.aiFeedback && (
                      <div className="bg-purple-50 p-4 rounded border border-purple-100 flex gap-3">
                        <div>
                          <p className="text-xs font-bold text-purple-600 mb-1">AI nhận xét:</p>
                          <p className="text-gray-700 italic text-sm">{ans.aiFeedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Giáo viên Feedback (nếu có) */}
                    {ans.teacherFeedback && (
                      <div className="bg-green-50 p-4 rounded border border-green-100">
                        <p className="text-xs font-bold text-green-600 mb-1">Giáo viên nhận xét:</p>
                        <p className="text-gray-800">{ans.teacherFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}