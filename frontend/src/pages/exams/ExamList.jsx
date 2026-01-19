"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const CURRENT_USER_ID = 1; // Giả định user ID = 1
const CURRENT_USER_ROLE = "TEACHER";

export default function ExamListPage() {
  const [allExams, setAllExams] = useState([]); 
  const [filteredExams, setFilteredExams] = useState([]);
  
  // 1. [MỚI] State để lưu số lần đã làm của từng bài thi { examId: số_lần }
  const [userAttempts, setUserAttempts] = useState({});

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [role, setRole] = useState(CURRENT_USER_ROLE);
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const location = useLocation(); 
  
  // Effect 1: Tải danh sách bài thi
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    
    fetch("/api/exams")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const activeExams = data.filter((exam) => exam.isActive === true);
          setAllExams(activeExams);
          setFilteredExams(activeExams);
        } else {
          setAllExams([]);
          setFilteredExams([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách bài thi:", err);
        setAllExams([]);
      });
    return () => clearInterval(timer);
  }, []);

  // 2. [MỚI] Effect tải lịch sử làm bài để đếm số lượt
  useEffect(() => {
    // Gọi API lấy lịch sử (Endpoint này bạn đã thêm ở bước trước)
    fetch(`/api/exams/history?userId=${CURRENT_USER_ID}`)
      .then(res => {
        if(res.ok) return res.json();
        return [];
      })
      .then(data => {
        // Chuyển mảng lịch sử thành Map đếm: { 101: 2, 102: 1 } (ExamId: Số lần)
        const counts = {};
        if (Array.isArray(data)) {
            data.forEach(attempt => {
                // Lấy ID bài thi từ object attempt (tuỳ cấu trúc JSON trả về)
                const eId = attempt.exam?.examId || attempt.examId;
                if (eId) {
                    counts[eId] = (counts[eId] || 0) + 1;
                }
            });
        }
        setUserAttempts(counts);
      })
      .catch(err => console.error("Lỗi tải lịch sử:", err));
  }, []);

  // Effect 3: Logic Lọc dữ liệu
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

        // Hiệu ứng nháy sáng để gây chú ý
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

  const startExam = async (examId) => {
    try {
      const res = await fetch(`/api/exams/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: examId, userId: CURRENT_USER_ID }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể bắt đầu bài thi");
      }
      const data = await res.json();
      navigate(`/exams/${examId}/attempt?attemptId=${data.attemptId}`);
    } catch (error) {
      alert(error.message || "Lỗi khi bắt đầu bài thi.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách bài kiểm tra</h1>

        {role === "TEACHER" && (
          <button
            onClick={() => navigate("/exams/manage")}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded shadow flex items-center gap-2 transition"
          >
            Quản lý bài thi
          </button>
        )}
      </div>

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
            <button onClick={() => setFilterStatus("ALL")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "ALL" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Tất cả</button>
            <button onClick={() => setFilterStatus("OPEN")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "OPEN" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Đang mở</button>
            <button onClick={() => setFilterStatus("EXPIRED")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "EXPIRED" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Đã kết thúc</button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredExams.map((exam, index) => {
          const hasEndTime = !!exam.endTime;
          const isExpired = hasEndTime && new Date(exam.endTime) < now;
          
          // 3. [MỚI] Logic kiểm tra số lượt
          const attemptsMade = userAttempts[exam.examId] || 0;
          const maxAttempts = exam.maxAttempts || 1; 
          const isLimitReached = attemptsMade >= maxAttempts;
          
          // Điều kiện được phép làm bài: Chưa hết hạn VÀ Chưa hết lượt
          const isOpen = !isExpired;
          const canTakeExam = isOpen && !isLimitReached;

          return (
            <div
              key={exam.examId || index}
              id={`exam-card-${exam.examId}`} 
              className={`border p-5 rounded-lg shadow-sm transition bg-white ${!isOpen ? 'bg-gray-50' : ''}`}
      
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-xl font-semibold ${isOpen ? 'text-gray-800' : 'text-gray-500'}`}>
                    {exam.title}
                  </h2>
                  <p className="text-gray-600 mt-1">{exam.description || "Không có mô tả"}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      {exam.duration} phút
                    </span>
                    
                    {/* 4. [MỚI] Hiển thị số lượt đã làm */}
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

                {/* 5. [MỚI] Nút bấm đổi màu theo trạng thái */}
                <button
                  onClick={() => startExam(exam.examId || 0)}
                  disabled={!canTakeExam}
                  className={`px-5 py-2 rounded transition font-medium min-w-[120px] shadow-sm
                        ${canTakeExam 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' // Nút Xanh (Được làm)
                            : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-80'   // Nút Đen (Bị khoá)
                        }
                    `}
                >
                  {isLimitReached ? 'Hết lượt' : (isOpen ? 'Làm bài' : 'Hết hạn')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}