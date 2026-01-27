import React, { useState, useEffect } from 'react';
import {
    BookOpen, Target, Clock, Trophy, Users, ShieldCheck,
    FileText, TrendingUp, CalendarDays, Calculator, ClipboardList, PlayCircle, ShoppingCart,
    Bot, Star, TrendingDown, ArrowRight, FileText as FileIcon, MoreVertical, PlusCircle
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudentData } from './ai/hooks/useStudentData';

// Import AI Components
import InsightCard from './ai/components/InsightCard';
import RecommendationPanel from './ai/components/RecommendationPanel';

import axiosClient from '../api/axiosClient';

// Component Danh sách bài thi gần đây (Thay thế cho ô nhập ID thủ công)
const RecentExamsCompact = ({ exams }) => {
    const navigate = useNavigate();

    if (!exams || exams.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <FileIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Kết quả bài thi</h3>
                </div>
                <button
                    onClick={() => navigate('/ai')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                >
                    Chi tiết
                </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {exams.slice(0, 4).map((exam) => (
                    <div
                        key={exam.attemptId}
                        onClick={() => navigate(`/ai/results/${exam.attemptId}`)}
                        className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 group-hover:border-indigo-200 transition-colors">
                                #{exam.attemptId}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">Exam Attempt</p>
                                <p className="text-[10px] text-gray-500">{new Date(exam.date).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${exam.totalScore >= 8 ? "text-emerald-500" :
                                exam.totalScore >= 5 ? "text-indigo-500" : "text-orange-500"
                                }`}>
                                {exam.totalScore?.toFixed(1) || "0.0"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Dữ liệu User (Lấy từ localStorage đã đăng nhập)
const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
const user = {
    name: storedUser.fullName || "User",
    role: (localStorage.getItem("userRole") || "student").toLowerCase()
};

// Component thẻ thống kê (Đã chuẩn hóa Tailwind)
const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const colorStyles = {
        blue: "border-l-blue-500 bg-blue-50 text-blue-600",
        teal: "border-l-teal-500 bg-teal-50 text-teal-600",
        amber: "border-l-amber-500 bg-amber-50 text-amber-600",
        purple: "border-l-purple-500 bg-purple-50 text-purple-600",
    };

    const selectedColor = colorStyles[color] || colorStyles.blue;
    // Tách màu nền icon ra từ chuỗi style trên (logic đơn giản hóa)
    const iconBg = selectedColor.replace("border-l-", "").split(" ")[1];

    return (
        <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 ${selectedColor.split(" ")[0]} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${iconBg} bg-opacity-50`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <p className="text-xs font-medium text-gray-500">{trend}</p>
        </div>
    );
};

const roleMessages = {
    student: "Bạn đã sẵn sàng cho một thử thách toán học khác chưa?",
    teacher: "Quản lý lớp học của bạn một cách hiệu quả.",
    admin: "Quản trị và giám sát hệ thống.",
};

const StudentDashboardGeneral = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("studentId") || localStorage.getItem("userId") || "1";

    const { statistics, insights, recommendations } = useStudentData(studentId);

    const [myCourses, setMyCourses] = useState([]);
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const API_URL = '/courses';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi song song 2 API lấy khóa học của tôi và gợi ý
                const [myRes, recRes] = await Promise.all([
                    axiosClient.get(`${API_URL}/mine`),
                    axiosClient.get(`${API_URL}/recommended`)
                ]);

                setMyCourses(myRes.data);
                setRecommendedCourses(recRes.data);
            } catch (err) {
                console.error("Lỗi tải dữ liệu Dashboard:", err);
                setMyCourses([]);
                setRecommendedCourses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    // Filtering logic
    const filteredCourses = myCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.courseId && course.courseId.toString().includes(searchTerm));

        if (filterStatus === "all") return matchesSearch;
        // Giả sử có thuộc tính status hoặc isActive
        if (filterStatus === "active") return matchesSearch && (course.isActive !== false);
        if (filterStatus === "inactive") return matchesSearch && (course.isActive === false);

        return matchesSearch;
    });

    const handleContinueLearning = (courseId) => navigate(`/learning/${courseId}`);
    const handleViewDetails = (courseId) => navigate(`/course-detail/${courseId}`);

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Chào bạn, <span className="text-indigo-900">{user?.name}</span>! 👋
                        </h1>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-semibold tracking-wider">
                            {roleMessages[user?.role || 'student']}
                        </p>
                    </div>
                </div>

                {/* 1. Thẻ Thống Kê (AI Data) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Tổng bài thi" value={statistics?.totalExams || "0"} icon={FileText} color="blue" trend="Cập nhật từ hệ thống" />
                    <StatCard title="Điểm trung bình" value={statistics?.averageScore?.toFixed(1) || "0.0"} icon={TrendingUp} color="teal" trend="+0.2 so với kỳ trước" />
                    <StatCard title="Điểm cao nhất" value={statistics?.highestScore?.toFixed(1) || "0.0"} icon={Trophy} color="amber" trend="Thành tích tốt nhất" />
                    <StatCard title="Điểm thấp nhất" value={statistics?.lowestScore?.toFixed(1) || "0.0"} icon={TrendingDown} color="purple" trend="Cần cải thiện thêm" />
                </div>

                {/* 2. KHÓA HỌC CỦA TÔI */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">Tổng quan về khóa học</h2>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 flex gap-3 border-b border-gray-50 bg-gray-50/30">
                        <select
                            className="text-xs border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="active">Đang học</option>
                            <option value="inactive">Đã đóng</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Tìm kiếm khóa học (Tên hoặc ID)..."
                            className="text-xs border border-gray-200 rounded px-3 py-1.5 bg-white flex-1 max-w-[250px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="p-6 animate-pulse bg-gray-50/50"></div>)
                        ) : filteredCourses.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 italic text-sm">
                                {searchTerm || filterStatus !== 'all' ? "Không tìm thấy khóa học nào khớp với bộ lọc." : "Bạn chưa tham gia khóa học nào."}
                            </div>
                        ) : (
                            filteredCourses.map((course, idx) => {
                                // Mảng màu nền giả lập theo ảnh mẫu
                                const bgColors = [
                                    'bg-pink-400', 'bg-blue-500', 'bg-purple-500',
                                    'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400'
                                ];
                                const bgColor = bgColors[idx % bgColors.length];

                                return (
                                    <div
                                        key={course.courseId}
                                        className="p-6 flex items-start gap-5 hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                        onClick={() => handleContinueLearning(course.courseId)}
                                    >
                                        <div className={`w-32 h-20 rounded-lg ${bgColor} shrink-0 shadow-inner opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                                            <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                                                [{course.courseId || '0000'}] - {course.title}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-tight">
                                                [CQ]_HKII2024-2025_IGCSE Learning Hub
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                                50% complete
                                            </p>
                                        </div>
                                        <button className="text-gray-300 hover:text-gray-600 p-1">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 3. KHÁM PHÁ KHÓA HỌC */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                                Khám Phá (Recommended)
                            </h2>
                            <p className="text-xs text-gray-500">Gợi ý những khóa học phù hợp nhất với hành trình của bạn.</p>
                        </div>
                        <button
                            onClick={() => navigate('/all-courses')}
                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                        >
                            Xem thêm <Star size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>)
                        ) : recommendedCourses.length === 0 ? (
                            <div className="col-span-full p-10 bg-slate-50 rounded-2xl border border-slate-100 text-center text-slate-400 text-sm">
                                Hiện chưa có gợi ý mới.
                            </div>
                        ) : (
                            recommendedCourses.map((course) => (
                                <div
                                    key={course.courseId}
                                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                Gợi ý cho bạn
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full">
                                                <Star size={12} fill="currentColor" /> 4.5
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-slate-500 text-[13px] line-clamp-2 min-h-[40px] mb-6">
                                            {course.description || "Bắt đầu bài học ngay hôm nay để đạt kết quả tốt nhất."}
                                        </p>

                                        <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                            <span className="text-indigo-600 font-extrabold text-lg">{course.price > 0 ? `$${course.price}` : 'FREE'}</span>
                                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                                                <Clock size={14} />
                                                {course.duration || '--'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50/30 border-t border-slate-50">
                                        <button
                                            onClick={() => handleViewDetails(course.courseId)}
                                            className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <BookOpen size={16} />
                                            Xem Chi Tiết
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 4. DỮ LIỆU PHÂN TÍCH VÀ GỢI Ý TỪ AI */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
                        <Bot className="w-8 h-8 text-indigo-600" />
                        AI Learning Compass
                    </h2>
                    <button
                        onClick={() => navigate(`/ai/dashboard/student?studentId=${studentId}`)}
                        className="text-sm text-blue-600 font-medium hover:underline">
                        Xem chi tiết phân tích
                        {/* <TrendingUp className="w-4 h-4" /> */}
                    </button>
                </div>

                <div className={`grid ${statistics?.recentExams?.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
                    {/* Kết quả Phân tích AI */}
                    <div className="md:col-span-1">
                        {insights ? (
                            <InsightCard insight={insights} />
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center py-10 h-full flex items-center justify-center">
                                <p className="text-gray-500 italic">Đang phân tích dữ liệu học tập...</p>
                            </div>
                        )}
                    </div>

                    {/* Gợi ý lộ trình học tập */}
                    <div className="md:col-span-1">
                        {recommendations ? (
                            <RecommendationPanel data={recommendations} />
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center py-10 h-full flex items-center justify-center">
                                <p className="text-gray-500 italic">Đang chuẩn bị gợi ý cho bạn...</p>
                            </div>
                        )}
                    </div>

                    {/* Kết quả gần đây (Thay thế cho QuickResultCard) */}
                    <div className="md:col-span-1">
                        <RecentExamsCompact exams={statistics?.recentExams} />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default StudentDashboardGeneral;
