"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Exam } from "./types";

// Giả lập ID người dùng và vai trò hiện tại (Thực tế sẽ lấy từ Login/AuthContext)
const CURRENT_USER_ID = 1;
const CURRENT_USER_ROLE = "TEACHER"; // Đổi thành "STUDENT" để ẩn nút tạo bài

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  // State lưu vai trò người dùng
  const [role] = useState(CURRENT_USER_ROLE); 
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:8080/api/exams")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setExams(data);
        } else {
          setExams([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách bài thi:", err);
        setExams([]);
      });
  }, []);

  const startExam = async (examId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/exams/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: examId, userId: CURRENT_USER_ID }),
      });

      if (!res.ok) throw new Error("Không thể bắt đầu bài thi");

      const data = await res.json();
      router.push(`/exams/${examId}/attempt?attemptId=${data.attemptId}`);
    } catch (error) {
      alert("Lỗi khi bắt đầu bài thi. Vui lòng thử lại!");
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* HEADER: Tiêu đề + Nút tạo bài (chỉ hiện nếu là TEACHER) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách bài kiểm tra</h1>

        {role === "TEACHER" && (
          <button
            onClick={() => router.push("/exams/create")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 transition"
          >
            {/* Icon dấu cộng đơn giản */}
            <span className="text-xl font-bold">+</span> 
            Tạo bài thi mới
          </button>
        )}
      </div>

      {exams.length === 0 && (
        <p className="text-gray-500 text-center py-10">Chưa có bài kiểm tra nào hoặc đang tải...</p>
      )}

      <div className="space-y-4">
        {exams?.map((exam) => (
          <div
            key={exam.examId}
            className="border p-5 rounded-lg shadow-sm hover:shadow-md transition bg-white"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{exam.title}</h2>
                <p className="text-gray-600 mt-1">{exam.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                   <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                     ⏱ {exam.duration} phút
                   </span>
                   {/* Có thể thêm trạng thái active/inactive nếu muốn */}
                   <span className={`px-2 py-1 rounded font-medium ${exam.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {exam.isActive ? 'Đang mở' : 'Đã đóng'}
                   </span>
                </div>
              </div>

              <button
                onClick={() => startExam(exam.examId)}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition font-medium"
              >
                Làm bài
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}