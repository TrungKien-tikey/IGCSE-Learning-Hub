"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CURRENT_USER_ID = 1;
const CURRENT_USER_ROLE = "TEACHER";

export default function ExamListPage() {
  // 1. Tách biệt danh sách gốc (allExams) và danh sách hiển thị (filteredExams)
  const [allExams, setAllExams] = useState([]); 
  const [filteredExams, setFilteredExams] = useState([]);
  
  // 2. State cho bộ lọc
  const [filterStatus, setFilterStatus] = useState("ALL"); // 'ALL', 'OPEN', 'EXPIRED'
  const [searchTerm, setSearchTerm] = useState("");

  const [role, setRole] = useState(CURRENT_USER_ROLE);
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  // Effect 1: Tải dữ liệu và đồng hồ
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    
    fetch("http://localhost:8080/api/exams")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Chỉ lấy các bài thi Active (không bị xóa mềm)
          const activeExams = data.filter((exam) => exam.isActive === true);
          setAllExams(activeExams);
          setFilteredExams(activeExams); // Mặc định hiển thị hết
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

  // Effect 2: Logic Lọc dữ liệu (Chạy mỗi khi search, đổi filter, hoặc thời gian trôi qua)
  useEffect(() => {
    let result = [...allExams];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      result = result.filter(exam => 
        exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo trạng thái (Đang mở / Hết hạn)
    if (filterStatus !== "ALL") {
      result = result.filter(exam => {
        const hasEndTime = !!exam.endTime;
        const isExpired = hasEndTime && new Date(exam.endTime) < now;
        
        if (filterStatus === "OPEN") return !isExpired;     // Lấy cái chưa hết hạn
        if (filterStatus === "EXPIRED") return isExpired;   // Lấy cái đã hết hạn
        return true;
      });
    }

    setFilteredExams(result);
  }, [allExams, filterStatus, searchTerm, now]);

  const startExam = async (examId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/exams/start`, {
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
      alert(error.message || "Lỗi khi bắt đầu bài thi. Vui lòng thử lại!");
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

      {/* --- PHẦN BỘ LỌC VÀ TÌM KIẾM MỚI --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Ô tìm kiếm */}
        <div className="w-full md:w-1/2 relative">
            <input 
                type="text" 
                placeholder="Tìm kiếm bài thi..." 
                className="w-full pl-5 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Các nút lọc trạng thái */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setFilterStatus("ALL")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "ALL" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
                Tất cả
            </button>
            <button 
                onClick={() => setFilterStatus("OPEN")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "OPEN" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
                Đang mở
            </button>
            <button 
                onClick={() => setFilterStatus("EXPIRED")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "EXPIRED" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
                Đã kết thúc
            </button>
        </div>
      </div>
      {/* ----------------------------------- */}

      {filteredExams.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded border-2 border-dashed">
          <p className="text-gray-500">
             {allExams.length === 0 ? "Hiện không có bài kiểm tra nào." : "Không tìm thấy kết quả phù hợp."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filteredExams.map((exam, index) => {
          const hasEndTime = !!exam.endTime;
          const isExpired = hasEndTime && new Date(exam.endTime) < now;
          const isOpen = !isExpired;

          return (
            <div
              key={exam.examId || index}
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
                    <span className="text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded border border-purple-100">
                      {exam.maxAttempts || 1} lượt làm
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
                <button
                  onClick={() => startExam(exam.examId || 0)}
                  disabled={!isOpen}
                  className={`px-5 py-2 rounded transition font-medium min-w-[120px] shadow-sm
                        ${isOpen ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-80'}
                    `}
                >
                  {isOpen ? 'Làm bài' : 'Hết hạn'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}