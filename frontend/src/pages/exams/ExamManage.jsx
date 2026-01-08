"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Xóa import Exam type vì JS không cần

export default function ManageExamsPage() {
  // Xóa <Exam[]>
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/exams")
      .then((res) => res.json())
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi tải danh sách:", err));
  }, []);

  // Xóa : string
  const formatDate = (dateString) => {
    if (!dateString) return "Không thời hạn";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  // --- HÀM XỬ LÝ ẨN BÀI THI (SOFT DELETE) ---
  // Xóa : number
  const handleSoftDelete = async (examId) => {
    const confirmDelete = window.confirm("Bạn muốn ẩn bài thi này? Học sinh sẽ không nhìn thấy bài thi nữa, nhưng dữ liệu điểm số vẫn được giữ lại.");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:8080/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExams((prevExams) => 
            prevExams.map((exam) => 
                exam.examId === examId ? { ...exam, isActive: false } : exam
            )
        );
        alert("Đã ẩn bài thi thành công!");
      } else {
        alert("Lỗi khi xử lý.");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi kết nối đến server.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-800">Quản lý bài thi</h1>
           <p className="text-gray-500 mt-1">Danh sách các bài thi bạn đã tạo</p>
        </div>
        
        <div className="flex gap-3">
            <button
                onClick={() => navigate("/exams")}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border transition"
            >
                ← Quay lại trang chủ
            </button>

            <button
                onClick={() => navigate("/exams/create")}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow-md flex items-center gap-2 transition font-medium"
            >
                <span className="text-xl font-bold">+</span> 
                Tạo bài thi mới
            </button>
        </div>
      </div>

      <div className="grid gap-4">
        {exams.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">Bạn chưa tạo bài thi nào.</p>
            </div>
        ) : (
            exams.map((exam) => (
            <div key={exam.examId} className={`border p-5 rounded-lg shadow-sm transition flex justify-between items-center ${exam.isActive ? 'bg-white' : 'bg-gray-100'}`}>
                <div className="flex-1">
                    <h3 className={`text-xl font-bold ${exam.isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                        {exam.title} 
                        {!exam.isActive && <span className="ml-2 text-sm text-red-500 font-normal">(Đã ẩn)</span>}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                        <span>⏳ {exam.duration} phút</span>
                        <span>📅 Hết hạn: {formatDate(exam.endTime)}</span>
                        <span className={`${exam.isActive ? "text-green-600" : "text-gray-500"} font-medium`}>
                            ● {exam.isActive ? "Đang kích hoạt" : "Đã ẩn"}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/exams/edit/${exam.examId}`)}
                        className="px-3 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium"
                    >
                        Sửa
                    </button>
                    
                    {exam.isActive && (
                        <button 
                            onClick={() => handleSoftDelete(exam.examId || 0)}
                            className="px-3 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded text-sm font-medium"
                        >
                            Ẩn bài thi
                        </button>
                    )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}