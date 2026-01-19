import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, BookOpen, Clock, CheckCircle,
    MessageSquare, Calendar, BarChart3, PlusCircle, ArrowRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const teacherName = localStorage.getItem("userName") || "Giáo viên";
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get('/api/courses/teacher-courses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách lớp học:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // Thẻ thống kê nhanh (Có thể tính toán từ dữ liệu thực nếu có đủ API)
    const stats = [
        { title: "Lớp học đang dạy", value: courses.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Tổng số học sinh", value: "Updating...", icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Bài kiểm tra cần chấm", value: "12", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
        { title: "Tỷ lệ hoàn thành", value: "85%", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-100" },
    ];

    return (
        <MainLayout>
            <div className="space-y-8 p-4">
                {/* Welcome Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Chào mừng trở lại, <span className="text-indigo-600">{teacherName}</span>
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Dưới đây là tổng quan về các lớp học và hoạt động giảng dạy của bạn hôm nay.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                            </div>
                            <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
                        </div>
                    ))}
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Lớp học gần đây */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                Lớp học của bạn
                            </h2>
                            <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                <PlusCircle className="w-4 h-4" />
                                Tạo lớp mới
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-slate-500 italic">Đang tải danh sách lớp học...</p>
                        ) : courses.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center">
                                <p className="text-slate-500 font-medium">Bạn chưa quản lý lớp học nào.</p>
                                <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Thêm lớp học đầu tiên</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {courses.map((course) => (
                                    <div
                                        key={course.courseId}
                                        onClick={() => navigate(`/ai/dashboard/teacher?classId=${course.courseId}`)}
                                        className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 text-lg transition-colors">{course.title}</h3>
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1 mb-3">{course.description || "Không có mô tả"}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50">
                                            <div className="flex gap-2">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">IGCSE</span>
                                                <span className="px-2 py-1 bg-emerald-50 rounded text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">ID: {course.courseId}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Hoạt động & Thông báo */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-amber-600" />
                            Lịch nhắc việc
                        </h2>
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                            <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border-l-4 border-amber-400">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Chấm bài Mock Test</p>
                                    <p className="text-xs text-slate-500">Hạn chót: 18:00 hôm nay</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border-l-4 border-blue-400">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Họp phụ huynh lớp 10A</p>
                                    <p className="text-xs text-slate-500">Thời gian: 09:00 Ngày mai</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/ai/dashboard/teacher')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                        >
                            <BarChart3 className="w-5 h-5" />
                            Xem AI Insights Tổng Quát
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
