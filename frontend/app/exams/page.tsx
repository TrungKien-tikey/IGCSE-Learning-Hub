"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Exam } from "./types";

const CURRENT_USER_ID = 1;
const CURRENT_USER_ROLE = "TEACHER";

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [role, setRole] = useState(CURRENT_USER_ROLE);
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    fetch("http://localhost:8080/api/exams")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // --- THAY ĐỔI Ở ĐÂY: Lọc chỉ lấy các bài thi đang Active ---
          const activeExams = data.filter((exam: any) => exam.isActive === true);
          setExams(activeExams);
          // -----------------------------------------------------------
        } else {
          setExams([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách bài thi:", err);
        setExams([]);
      });
    return () => clearInterval(timer);
  }, []);

  const startExam = async (examId: number) => {
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
      router.push(`/exams/${examId}/attempt?attemptId=${data.attemptId}`);
    } catch (error: any) {
      alert(error.message || "Lỗi khi bắt đầu bài thi. Vui lòng thử lại!");
    }
  };

  const formatDate = (dateString: string) => {
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
            onClick={() => router.push("/exams/manage")} 
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded shadow flex items-center gap-2 transition"
          >
            <span>⚙️</span>
            Quản lý bài thi
          </button>
        )}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded border-2 border-dashed">
            <p className="text-gray-500">Hiện không có bài kiểm tra nào đang mở.</p>
        </div>
      )}

      <div className="space-y-4">
        {exams?.map((exam, index) => {
          const hasEndTime = !!exam.endTime;
          const isExpired = hasEndTime && new Date(exam.endTime!) < now;
          // Vì đã lọc isActive ở trên, nên ở đây chắc chắn isActive = true
          // isOpen chỉ còn phụ thuộc vào việc hết hạn hay chưa
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
                      ⏱ {exam.duration} phút
                    </span>
                    <span className="text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded border border-purple-100">
                      {exam.maxAttempts || 1} lượt làm
                    </span>
                    {hasEndTime && (
                      <span className={`px-2 py-1 rounded border ${isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {isExpired ? 'Hết hạn: ' : 'Hạn chót: '} {formatDate(exam.endTime!)}
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