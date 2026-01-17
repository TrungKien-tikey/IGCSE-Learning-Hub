import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BookOpen, Target, Clock, Trophy, Users, ShieldCheck,
    FileText, TrendingUp, CalendarDays, Calculator, ClipboardList, PlayCircle, ShoppingCart,
    Bot, Star, TrendingDown, ArrowRight, FileText as FileIcon
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudentData } from './ai/hooks/useStudentData';

// Import AI Components
import InsightCard from './ai/components/InsightCard';
import RecommendationPanel from './ai/components/RecommendationPanel';

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

// Dữ liệu User (Lấy từ localStorage nếu đã đăng nhập)
const user = {
    name: localStorage.getItem("userName") || "User",
    role: localStorage.getItem("userRole")?.toLowerCase() || "student"
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
    student: "Ready for another math challenge?",
    teacher: "Managing your classes effectively.",
    admin: "System administration and monitoring.",
};

const StudentDashboardGeneral = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("studentId") || localStorage.getItem("userId") || "1";

    const { statistics, insights, recommendations } = useStudentData(studentId);

    const [myCourses, setMyCourses] = useState([]);
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api/courses';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const myRes = await axios.get(`${API_URL}/my-courses?userId=${studentId}`);
                const myData = myRes.data;
                const allRes = await axios.get(API_URL);
                const allData = allRes.data;
                const enrolledIds = myData.map(course => course.courseId);
                const recData = allData.filter(course =>
                    course.active === true && !enrolledIds.includes(course.courseId)
                );
                setMyCourses(myData);
                setRecommendedCourses(recData);
            } catch (err) {
                console.error("Lỗi tải dữ liệu Dashboard:", err);
                setMyCourses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const handleContinueLearning = (courseId) => navigate(`/learning/${courseId}`);
    const handleViewDetails = (courseId) => navigate(`/course-detail/${courseId}`);

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900">
                            {user?.role === 'student' ? 'Welcome back,' : 'Hello,'} <span className="text-blue-600">{user?.name}</span>
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Role: <span className="capitalize font-semibold text-blue-500">{user?.role}</span> • {roleMessages[user?.role || 'student']}
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
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold font-serif text-gray-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Đang Học (My Courses)
                        </h2>
                        <button onClick={() => navigate('/my-courses')} className="text-sm text-blue-600 font-medium hover:underline">Xem tất cả</button>
                    </div>

                    {loading ? <p>Đang tải...</p> : myCourses.length === 0 ? <p className="text-gray-500 italic">Bạn chưa đăng ký khóa học nào.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myCourses.map((course) => (
                                <div key={course.courseId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:shadow-md transition-all">
                                    <div className="w-24 h-24 rounded-lg bg-blue-100 flex items-center justify-center text-2xl shrink-0">📚</div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{course.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{course.description || "Không có mô tả"}</p>
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-600">Tiến độ</span>
                                                <span className="font-bold text-blue-600">50%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => handleContinueLearning(course.courseId)} className="p-3 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors" title="Học tiếp">
                                            <PlayCircle className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. KHÁM PHÁ KHÓA HỌC */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold font-serif text-gray-800 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-amber-600" />
                            Khóa Học Mới (Recommended)
                        </h2>
                        <button onClick={() => navigate('/all-courses')} className="text-sm text-blue-600 font-medium hover:underline">Xem thêm</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recommendedCourses.map((course) => (
                            <div key={course.courseId} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                                <div className="h-32 bg-amber-50 relative overflow-hidden flex items-center justify-center">
                                    <span className="text-4xl">🎓</span>
                                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">⭐ 4.5</div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 mb-1 truncate">{course.title}</h3>
                                    <p className="text-xs text-gray-500 mb-3">Thời lượng: {course.duration}</p>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-lg font-bold text-blue-600">{course.price > 0 ? `$${course.price}` : 'Free'}</span>
                                        <button onClick={() => handleViewDetails(course.courseId)} className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-100 transition-colors">Xem Chi Tiết</button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-bold shadow-sm"
                    >
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
