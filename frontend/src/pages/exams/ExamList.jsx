"use client";

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCommentDots, FaHistory, FaEye } from "react-icons/fa"; // Thêm icon
import MainLayout from '../../layouts/MainLayout';
import CommentRoom from '../../components/CommentRoom';
import examClient from '../../api/examClient';

export default function ExamListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const accessToken = localStorage.getItem("accessToken");
  console.log("Current Token:", accessToken);
  // --- 1. STATE QUẢN LÝ USER (Thay cho hằng số cứng) ---
  const [userId, setUserId] = useState(null);

  // State dữ liệu
  const [allExams, setAllExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [historyMap, setHistoryMap] = useState({});
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [now, setNow] = useState(new Date());
  const [userAttempts, setUserAttempts] = useState({}); // Đếm số lượt làm bài

  // State quản lý việc mở khung comment (mới thêm)
  const [activeSection, setActiveSection] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Nếu không có token, đá về login
    if (!accessToken) {
      // navigate("/login"); // Bỏ comment nếu muốn bắt buộc login
    }
  }, [accessToken, navigate]);

  // --- 3. EFFECT TẢI DỮ LIỆU (Chỉ chạy khi đã xác định Role và KHÔNG PHẢI Teacher) ---

  // Effect 1: Tải danh sách bài thi
  useEffect(() => {
    if (!accessToken) return;
    const timer = setInterval(() => setNow(new Date()), 60000);

    // A. Tải danh sách bài thi
    const fetchExams = async () => {
      try {
        const res = await examClient.get('');
        const data = res.data; // Axios trả dữ liệu trong .data

        if (Array.isArray(data)) {
          const activeExams = data.filter((exam) => exam.isActive === true);
          setAllExams(activeExams);
          setFilteredExams(activeExams);
        }
      } catch (err) {
        console.error("Lỗi tải bài thi:", err);
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      }
    };

    // B. Tải lịch sử làm bài (Dùng userId lấy từ localStorage)

    const fetchHistory = async () => {
      try {
        const res = await examClient.get('/history');
        const data = res.data;

        const map = {};
        if (Array.isArray(data)) {
          // Sắp xếp attempt mới nhất lên đầu
          data.sort((b, a) => new Date(b.startedAt) - new Date(a.startedAt));

          data.forEach(attempt => {
            const eId = attempt.exam?.examId || attempt.examId;
            if (eId) {
              if (!map[eId]) map[eId] = [];
              map[eId].push(attempt);
            }
          });
        }
        setHistoryMap(map);
      } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
      }
    };

    fetchExams();
    fetchHistory();

    return () => clearInterval(timer);
  }, [accessToken, navigate]); // Chạy lại khi userId thay đổi

  // Effect 4: Logic Lọc dữ liệu
  useEffect(() => {
    let result = [...allExams];

    if (searchTerm) {
      result = result.filter(exam =>
        exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "ALL") {
      result = result.filter(exam => {
        const hasEndTime = !!exam.endTime;
        const isExpired = hasEndTime && new Date(exam.endTime) < now;

        if (filterStatus === "OPEN") return !isExpired;
        if (filterStatus === "EXPIRED") return isExpired;
        return true;
      });
    }

    setFilteredExams(result);
  }, [allExams, filterStatus, searchTerm, now]);

  useEffect(() => {
    // Chỉ chạy khi danh sách đã lọc xong VÀ có yêu cầu cuộn từ trang trước
    if (filteredExams.length > 0 && location.state?.scrollToId) {
      const targetId = location.state.scrollToId;
      const element = document.getElementById(`exam-card-${targetId}`);

      if (element) {
        // Cuộn xuống mượt mà
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = "all 0.5s";
        element.style.border = "2px solid #2563eb"; // Viền xanh
        element.style.transform = "scale(1.02)";    // Phóng to nhẹ

        // Tắt hiệu ứng sau 2 giây
        setTimeout(() => {
          element.style.border = "1px solid #e5e7eb"; // Trả về màu viền gốc
          element.style.transform = "scale(1)";
          // Xóa state để F5 không bị cuộn lại
          window.history.replaceState({}, document.title);
        }, 2000);
      }
    }
  }, [filteredExams, location.state]);

  const handleExamAction = async (examId, unfinishedAttempt) => {
    // 1. Nếu có bài đang làm dở -> Vào thẳng bài đó (Không gọi API tạo mới)
    if (unfinishedAttempt) {
      navigate(`/exams/${examId}/attempt?attemptId=${unfinishedAttempt.attemptId}`);
      return;
    }

    // 2. Nếu không -> Gọi API tạo bài mới
    try {
      const res = await examClient.post('/start',
        { examId: examId }
      );

      // Axios sẽ nhảy vào catch nếu lỗi, nên nếu chạy đến đây là thành công (2xx)
      const data = res.data;
      navigate(`/exams/${examId}/attempt?attemptId=${data.attemptId}`);

    } catch (error) {
      // Lấy message lỗi từ response của server
      const message = error.response?.data?.message || "Không thể bắt đầu bài thi";
      toast.error(message);
    }
  };

  const handleToggleSection = (type, examId) => {
    if (activeSection?.type === type && activeSection?.examId === examId) {
      setActiveSection(null); // Đóng nếu đang mở đúng cái đó
    } else {
      setActiveSection({ type, examId }); // Mở cái mới
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  const isAttemptSubmitted = (attempt) => {
    return !!(attempt.endTime || attempt.submittedAt);
  };

  return (
    <MainLayout>
      <div className="">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Danh sách bài kiểm tra</h1>

        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Tìm kiếm bài thi..."
              className="w-full pl-5 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['ALL', 'OPEN', 'EXPIRED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === status ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {status === 'ALL' ? 'Tất cả' : status === 'OPEN' ? 'Đang mở' : 'Đã kết thúc'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredExams.map((exam, index) => {
            const hasEndTime = !!exam.endTime;
            const isExpired = hasEndTime && new Date(exam.endTime) < now;

            const examHistory = historyMap[exam.examId] || [];
            const unfinishedAttempt = examHistory.find(att => !isAttemptSubmitted(att));
            const attemptsMade = examHistory.length;
            const maxAttempts = exam.maxAttempts || 1;
            const isLimitReached = attemptsMade >= maxAttempts;

            const isOpen = !isExpired;
            const canTakeExam = (isOpen && !isLimitReached) || !!unfinishedAttempt;
            const hasTaken = attemptsMade > 0;
            const isCommentOpen = activeSection?.type === 'COMMENT' && activeSection?.examId === exam.examId;
            const isScoreOpen = activeSection?.type === 'SCORE' && activeSection?.examId === exam.examId;

            return (
              <div
                key={exam.examId || index}
                id={`exam-card-${exam.examId}`}
                className={`border p-5 rounded-lg shadow-sm transition bg-white ${!isOpen ? 'bg-gray-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h2 className={`text-xl font-semibold ${isOpen ? 'text-gray-800' : 'text-gray-500'}`}>
                      {exam.title}
                    </h2>
                    <p className="text-gray-600 mt-1">{exam.description || "Không có mô tả"}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm">
                      <button
                        onClick={() => handleToggleSection('COMMENT', exam.examId)}
                        className={`flex items-center gap-1 transition mr-2 ${isCommentOpen ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-500'}`}
                      >
                        <FaCommentDots size={18} />
                        <span>Thảo luận</span>
                      </button>

                      <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        {exam.duration} phút
                      </span>

                      <span className={`font-medium px-2 py-1 rounded border ${isLimitReached ? 'bg-red-50 text-red-600 border-red-200' : 'text-purple-600 bg-purple-50 border-purple-100'}`}>
                        {attemptsMade} / {maxAttempts} lượt
                      </span>

                      {hasEndTime && (
                        <span className={`px-2 py-1 rounded border ${isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {isExpired ? 'Hết hạn: ' : 'Hạn chót: '} {formatDate(exam.endTime)}
                        </span>
                      )}

                      <span className={`px-2 py-1 rounded font-bold border ${isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                        {isOpen ? 'Đang mở' : 'Đã kết thúc'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => handleExamAction(exam.examId, unfinishedAttempt)}
                      disabled={!canTakeExam && !unfinishedAttempt}
                      className={`px-5 py-2 rounded transition font-medium min-w-[140px] shadow-sm text-center flex justify-center items-center gap-2
                        ${unfinishedAttempt
                          ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse' // Style cho nút Làm tiếp
                          : canTakeExam
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                            : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-80'
                        }
                      `}
                    >
                      {/* LOGIC HIỂN THỊ CHỮ TRÊN NÚT */}
                      {unfinishedAttempt ? (
                        <> Làm tiếp </>
                      ) : isLimitReached ? (
                        'Hết lượt'
                      ) : isOpen ? (
                        <>Làm bài </>
                      ) : (
                        'Hết hạn'
                      )}
                    </button>

                    {/* [MỚI] NÚT XEM ĐIỂM */}
                    {hasTaken && (
                      <button
                        onClick={() => handleToggleSection('SCORE', exam.examId)}
                        className={`px-5 py-2 rounded transition font-medium min-w-[140px] shadow-sm text-center border flex items-center justify-center gap-2
                            ${isScoreOpen
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        Xem điểm
                      </button>
                    )}
                  </div>
                </div>

                {isCommentOpen && (
                  <div className="mt-5 pt-5 border-t border-gray-100 animate-fade-in">
                    <CommentRoom examId={exam.examId} currentUser={currentUser} />
                  </div>
                )}

                {/* 2. KHUNG DANH SÁCH ĐIỂM (HIỂN THỊ DƯỚI DẠNG BẢNG) */}
                {isScoreOpen && (
                  <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-4 animate-fade-in">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      Lịch sử làm bài ({attemptsMade} lần)
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left bg-white rounded-lg overflow-hidden shadow-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                          <tr>
                            <th className="px-4 py-3 text-center">Lần thi</th>
                            <th className="px-4 py-3 text-center">Thời gian nộp</th>
                            <th className="px-4 py-3 text-center">Điểm số</th>
                            <th className="px-4 py-3 text-center">Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examHistory.map((attempt, idx) => {
                            const displayTime = attempt.endTime || attempt.submittedAt // Thử lấy cả 2 trường

                            return (
                              <tr key={attempt.attemptId} className="border-b hover:bg-gray-50 last:border-b-0">
                                <td className="px-4 py-3 font-medium text-center">{idx + 1}</td>
                                <td className="px-4 py-3 text-gray-600 text-center">
                                  {displayTime ? (
                                    formatDate(displayTime)
                                  ) : attempt.totalScore !== null ? (
                                    <span className="text-green-600 font-medium">Đã nộp</span>
                                  ) : (
                                    <span className="text-orange-500 italic">
                                      Đang làm...
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {attempt.totalScore !== null ? (
                                    <span className={`font-bold ${attempt.totalScore >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                                      {attempt.totalScore}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">--</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {attempt.totalScore !== null ? (
                                    <button
                                      onClick={() => navigate(`/exams/review/${attempt.attemptId}`)}
                                      className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition"
                                      title="Xem lại bài làm"
                                    >
                                      Xem
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleExamAction(exam.examId, attempt)}
                                      className="text-orange-500 hover:text-orange-700 font-medium hover:underline text-xs"
                                    >
                                      Làm tiếp
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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