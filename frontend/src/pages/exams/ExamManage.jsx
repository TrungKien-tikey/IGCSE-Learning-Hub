"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from '../../layouts/MainLayout';
// Import thêm component và icon
import CommentRoom from "../../components/CommentRoom";
import { MessageCircle, X } from "lucide-react";

export default function ManageExamsPage() {
    const [exams, setExams] = useState([]);

    // --- STATE CHO BỘ LỌC ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL"); // 'ALL', 'ACTIVE', 'HIDDEN'

    // --- STATE CHO BÌNH LUẬN ---
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [showComments, setShowComments] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/exams")
            .then((res) => res.json())
            .then((data) => setExams(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Lỗi tải danh sách:", err));
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Không thời hạn";
        return new Date(dateString).toLocaleString("vi-VN", {
            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
        });
    };

    const handleSoftDelete = async (examId) => {
        const confirmDelete = window.confirm("Bạn muốn ẩn bài thi này? Học sinh sẽ không nhìn thấy bài thi nữa, nhưng dữ liệu điểm số vẫn được giữ lại.");
        if (!confirmDelete) return;
        try {
            const res = await fetch(`/api/exams/${examId}`, {
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

    const filteredExams = exams.filter((exam) => {
        // 1. Lọc theo tên
        const matchesSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Lọc theo trạng thái
        let matchesStatus = true;
        if (filterStatus === "ACTIVE") {
            matchesStatus = exam.isActive === true;
        } else if (filterStatus === "HIDDEN") {
            matchesStatus = exam.isActive === false;
        }

        return matchesSearch && matchesStatus;
    });

    // Hàm mở khung chat
    const openComments = (examId) => {
        setSelectedExamId(examId);
        setShowComments(true);
    };

    return (
        <MainLayout>
            <div className="">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Quản lý bài thi</h1>
                        <p className="text-gray-500 mt-1">Danh sách các bài thi bạn đã tạo</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/exams/create")}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow-md flex items-center gap-2 transition font-medium"
                        >
                            <span className="text-xl font-bold">+</span>
                            Tạo bài thi mới
                        </button>
                    </div>
                </div>

                {/* --- THANH CÔNG CỤ TÌM KIẾM & LỌC --- */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Ô tìm kiếm */}
                    <div className="w-full md:w-1/2 relative">
                        <input
                            type="text"
                            placeholder="Tìm bài thi..."
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
                            onClick={() => setFilterStatus("ACTIVE")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "ACTIVE" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Đang hiện
                        </button>
                        <button
                            onClick={() => setFilterStatus("HIDDEN")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === "HIDDEN" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Đã ẩn
                        </button>
                    </div>
                </div>

                {/* --- DANH SÁCH BÀI THI --- */}
                <div className="grid gap-4">
                    {filteredExams.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
                            <p className="text-gray-500">
                                {exams.length === 0 ? "Bạn chưa tạo bài thi nào." : "Không tìm thấy bài thi phù hợp."}
                            </p>
                        </div>
                    ) : (
                        filteredExams.map((exam) => (
                            <div key={exam.examId} className={`border p-5 rounded-lg shadow-sm transition flex justify-between items-center ${exam.isActive ? 'bg-white' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold flex items-center gap-2 ${exam.isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                        {exam.title}
                                        {!exam.isActive && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded border border-red-200">Đã ẩn</span>}
                                    </h3>
                                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                        <span className="text-blue-600">{exam.duration} phút</span>
                                        <span className="text-red-600">Số lần làm: {exam.maxAttempts}</span>
                                        <span className="text-yellow-600">Hết hạn: {formatDate(exam.endTime)}</span>
                                        <span className={`${exam.isActive ? "text-green-600" : "text-gray-400"} font-medium`}>
                                            {exam.isActive ? "Đang kích hoạt" : "Không hiển thị"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    {/* ICON BÌNH LUẬN (CHAT) */}
                                    <button
                                        onClick={() => openComments(exam.examId)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition flex items-center gap-1"
                                        title="Thảo luận bài thi"
                                    >
                                        <MessageCircle size={20} />
                                        <span className="text-xs font-semibold">Chat</span>
                                    </button>

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
                                            Ẩn
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- MODAL BÌNH LUẬN --- */}
            {showComments && selectedExamId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
                        <button
                            onClick={() => setShowComments(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition z-10"
                        >
                            <X size={24} />
                        </button>
                        <div className="p-4 overflow-y-auto flex-1">
                            {/* Sử dụng chung selectedExamId để vào cùng room với ExamList */}
                            <CommentRoom examId={selectedExamId} />
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}