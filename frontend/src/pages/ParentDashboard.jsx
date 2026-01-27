import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
    Users, TrendingUp, Trophy, TrendingDown, FileText, Bot,
    Search, Mail, CheckCircle, AlertCircle, BookOpen, PlayCircle,
    BarChart3, LayoutDashboard, Bell
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useStudentData } from './ai/hooks/useStudentData';
import InsightCard from './ai/components/InsightCard';
import RecommendationPanel from './ai/components/RecommendationPanel';
import { useNavigate } from 'react-router-dom';

// Component thẻ thống kê
const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const colorStyles = {
        blue: "border-l-blue-500 bg-blue-50 text-blue-600",
        teal: "border-l-teal-500 bg-teal-50 text-teal-600",
        amber: "border-l-amber-500 bg-amber-50 text-amber-600",
        purple: "border-l-purple-500 bg-purple-50 text-purple-600",
    };

    const selectedColor = colorStyles[color] || colorStyles.blue;
    const iconBg = selectedColor.replace("border-l-", "").split(" ")[1];

    return (
        <div className={`bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm border-l-4 ${selectedColor.split(" ")[0]} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4">
                <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">{title}</p>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg ${iconBg} bg-opacity-50 flex-shrink-0 ml-2`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 line-clamp-1">{trend}</p>
        </div>
    );
};

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [studentEmail, setStudentEmail] = useState("");
    const [linkedStudent, setLinkedStudent] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    // Lấy thông tin đã liên kết từ localStorage
    useEffect(() => {
        const storedStudent = localStorage.getItem("linkedStudent");
        if (storedStudent) {
            setLinkedStudent(JSON.parse(storedStudent));
        }
    }, []);

    // Sử dụng hook lấy dữ liệu nếu đã liên kết
    const { statistics, insights, recommendations, loading: dataLoading, error: dataError } =
        useStudentData(linkedStudent?.userId);

    const handleLinkStudent = async (e) => {
        e.preventDefault();
        if (!studentEmail) return;

        setIsSearching(true);
        setSearchError("");

        try {
            // Gọi API search bằng email (Backend vừa bổ sung)
            // Override baseURL vì Controller là /api/users (không có /v1)
            const res = await axiosClient.get('/search', {
                baseURL: '/api/users',
                params: { email: studentEmail }
            });
            const studentData = res.data;

            console.log(">>> [Search] Result:", studentData);

            if (studentData && studentData.role?.toUpperCase() === 'STUDENT') {
                setLinkedStudent(studentData);
                localStorage.setItem("linkedStudent", JSON.stringify(studentData));
                setStudentEmail("");
            } else {
                console.warn(">>> [Search] Invalid Role:", studentData?.role);
                setSearchError("Tìm thấy tài khoản nhưng không phải là Học sinh (Role: " + studentData?.role + ")");
            }
        } catch (err) {
            setSearchError(err.response?.status === 404 ? "Không tìm thấy học sinh." : "Lỗi hệ thống khi tìm kiếm.");
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleUnlink = () => {
        if (window.confirm("Bạn có chắc muốn hủy liên kết với học sinh này?")) {
            setLinkedStudent(null);
            localStorage.removeItem("linkedStudent");
        }
    };

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900">
                            Parent <span className="text-indigo-600">Dashboard</span>
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Chào mừng bạn trở lại, hệ thống giám sát học tập dành cho Phụ huynh.
                        </p>
                    </div>
                </div>

                {!linkedStudent ? (
                    /* Link Student Form */
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto text-center mt-10">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Liên kết với tài khoản con</h2>
                        <p className="text-gray-500 mb-8">Nhập email tài khoản của con bạn để bắt đầu theo dõi tiến độ học tập và phân tích từ AI.</p>

                        <form onSubmit={handleLinkStudent} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    placeholder="example@student.com"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {searchError && (
                                <p className="text-red-500 text-sm flex items-center justify-center gap-1">
                                    <AlertCircle size={14} /> {searchError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSearching}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:bg-indigo-400 flex items-center justify-center gap-2"
                            >
                                {isSearching ? "Đang tìm kiếm..." : (
                                    <>
                                        <Search size={18} /> Liên kết ngay
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Full Dashboard View */
                    <div className="space-y-8 animate-fade-in">
                        {/* Student Info Card */}
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-l-indigo-600">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-2xl font-bold text-indigo-600">
                                    {linkedStudent.avatar ? (
                                        <img src={linkedStudent.avatar} alt="Student" className="w-full h-full object-cover" />
                                    ) : (
                                        linkedStudent.fullName?.charAt(0) || 'S'
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{linkedStudent.fullName}</h3>
                                    <p className="text-gray-500 text-sm flex items-center gap-1">
                                        <CheckCircle size={14} className="text-emerald-500" /> Đã liên kết: {linkedStudent.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleUnlink}
                                className="text-gray-400 hover:text-red-500 transition-colors text-sm font-medium border border-gray-200 px-4 py-2 rounded-lg hover:border-red-100"
                            >
                                Hủy liên kết
                            </button>
                        </div>

                        {/* 1. Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Tổng bài thi"
                                value={statistics?.totalExams || "0"}
                                icon={FileText} color="blue" trend="Dữ liệu đồng bộ trực tiếp"
                            />
                            <StatCard
                                title="Điểm trung bình"
                                value={statistics?.averageScore?.toFixed(1) || "0.0"}
                                icon={TrendingUp} color="teal" trend="Đánh giá năng lực tổng quát"
                            />
                            <StatCard
                                title="Thành tích tốt nhất"
                                value={statistics?.highestScore?.toFixed(1) || "0.0"}
                                icon={Trophy} color="amber" trend="Điểm cao nhất đạt được"
                            />
                            <StatCard
                                title="Cần cải thiện"
                                value={statistics?.lowestScore?.toFixed(1) || "0.0"}
                                icon={TrendingDown} color="purple" trend="Khu vực cần quan tâm"
                            />
                        </div>

                        {/* 2. AI Analytics Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Bot className="w-8 h-8 text-indigo-600" />
                                <h2 className="text-2xl font-serif font-bold text-gray-900">AI Learning Insights for Parent</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {insights ? (
                                    <InsightCard insight={insights} />
                                ) : (
                                    <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm text-center">
                                        <p className="text-gray-500 italic">Đang phân tích dữ liệu học tập của con...</p>
                                    </div>
                                )}

                                {recommendations ? (
                                    <RecommendationPanel data={recommendations} />
                                ) : (
                                    <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm text-center">
                                        <p className="text-gray-500 italic">Đang chuẩn bị lộ trình học tập tối ưu...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Alerts / Quick Links */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Bell size={18} className="text-amber-500" /> Thông báo mới nhất
                                </h4>
                                <div className="space-y-4">
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
                                        Con bạn vừa hoàn thành bài luyện tập với số điểm 9.5
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
                                        Con bạn chưa làm bài tập Module Math Logic trong 3 ngày.
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">Đồng hành cùng con</h3>
                                        <p className="text-indigo-100 text-sm max-w-md">
                                            Xem chi tiết các báo cáo hiệu suất và nhận gợi ý từ chuyên gia AI để giúp con bạn đạt kết quả tốt nhất.
                                        </p>
                                    </div>
                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => navigate('/progress')}
                                            className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                                        >
                                            Xem chi tiết tiến độ
                                        </button>
                                        <button
                                            onClick={() => navigate('/reports')}
                                            className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-400 transition-colors border border-indigo-400"
                                        >
                                            Báo cáo tuần
                                        </button>
                                    </div>
                                </div>
                                <BarChart3 className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default ParentDashboard;
