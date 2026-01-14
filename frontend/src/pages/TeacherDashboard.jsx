import React from 'react';
import {
    Users, BookOpen, Clock, CheckCircle,
    MessageSquare, Calendar, BarChart3, PlusCircle
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function TeacherDashboard() {
    const teacherName = localStorage.getItem("userName") || "Giáo viên";

    // Thẻ thống kê nhanh
    const stats = [
        { title: "Lớp học đang dạy", value: "4", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Tổng số học sinh", value: "124", icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['Toán nâng cao - Lớp 10A', 'Vật lý đại chúng - Lớp 11B'].map((course, i) => (
                                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group">
                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600">{course}</h3>
                                    <p className="text-xs text-slate-500 mt-1">32 Học sinh • 12 Bài tập</p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">IGCSE</span>
                                        <span className="px-2 py-1 bg-indigo-50 rounded text-[10px] font-bold text-indigo-600">ACTIVE</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Hoạt động & Thông báo */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-amber-600" />
                            Lịch nhắc việc
                        </h2>
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
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

                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Xem báo cáo tổng hợp
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
