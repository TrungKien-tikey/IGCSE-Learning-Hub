import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BookOpen, Target, Clock, Trophy, Users, ShieldCheck,
    FileText, TrendingUp, CalendarDays, Calculator, ClipboardList, PlayCircle, ShoppingCart
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

// Dữ liệu User (Lấy từ localStorage nếu đã đăng nhập)
const user = {
    name: "User", // Bạn có thể lưu tên vào localStorage lúc Login nếu muốn
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

// Data mẫu cho hoạt động gần đây
const activities = [
    { title: "Quadratic Equations", subtitle: "Completed Module 3", time: "2h ago", icon: Calculator, color: "text-blue-600 bg-blue-100" },
    { title: "Algebra Mid-Term", subtitle: "Scored 92/100", time: "Yesterday", icon: Trophy, color: "text-teal-600 bg-teal-100" },
    { title: "Weekly Report", subtitle: "Auto-generated", time: "2 days ago", icon: FileText, color: "text-amber-600 bg-amber-100" },
];

const roleMessages = {
    student: "Ready for another math challenge?",
    teacher: "Managing your classes effectively.",
    admin: "System administration and monitoring.",
};

const StudentDashboardGeneral = () => {

    const navigate = useNavigate();

    // --- 1. KHAI BÁO BIẾN DỮ LIỆU (STATE) ---
    const [myCourses, setMyCourses] = useState([]);
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api/courses';

    // --- 2. GỌI API LẤY DỮ LIỆU ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userId = 1; // Giả sử bạn đang đăng nhập với ID = 1 (Giống lúc bấm đăng ký)

                // A. Lấy danh sách ĐÃ MUA từ Backend
                // (API này sẽ lục trong bảng enrollment xem user 1 đã mua gì)
                const myRes = await axios.get(`${API_URL}/my-courses?userId=${userId}`);
                const myData = myRes.data;

                // B. Lấy TẤT CẢ khóa học để lọc ra danh sách Gợi ý
                const allRes = await axios.get(API_URL);
                const allData = allRes.data;

                // C. Xử lý Logic lọc "Khóa học mới" (Recommended)
                // Lấy danh sách ID của các khóa đã mua
                const enrolledIds = myData.map(course => course.courseId);

                // Lọc: Chỉ lấy khóa đang Active VÀ KHÔNG nằm trong danh sách đã mua
                const recData = allData.filter(course =>
                    course.active === true && !enrolledIds.includes(course.courseId)
                );

                // D. Cập nhật State
                setMyCourses(myData);
                setRecommendedCourses(recData);

            } catch (err) {
                console.error("Lỗi tải dữ liệu Dashboard:", err);
                // Mẹo: Nếu API my-courses lỗi (do chưa restart backend), nó sẽ rỗng
                setMyCourses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 3. Các hàm chuyển trang
    const handleContinueLearning = (courseId) => navigate(`/learning/${courseId}`);
    const handleViewDetails = (courseId) => navigate(`/course-detail/${courseId}`);

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Header Section */}
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

                {/* 1. Thẻ Thống Kê (Stats Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Modules Done" value="12/24" icon={BookOpen} color="blue" trend="+2 this week" />
                    <StatCard title="Average Score" value="87%" icon={Target} color="teal" trend="Top 15%" />
                    <StatCard title="Study Hours" value="24.5h" icon={Clock} color="amber" trend="Last 30 days" />
                    <StatCard title="Badges" value="8" icon={Trophy} color="purple" trend="New unlocked!" />
                </div>

                {/* 2. KHÓA HỌC CỦA TÔI (Đã đăng ký) */}
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
                                    {/* Ảnh giả lập */}
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
                                        <button
                                            onClick={() => handleContinueLearning(course.courseId)}
                                            className="p-3 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors" title="Học tiếp"
                                        >
                                            <PlayCircle className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. KHÁM PHÁ KHÓA HỌC (Gợi ý) */}
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
                                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                        ⭐ 4.5
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 mb-1 truncate">{course.title}</h3>
                                    <p className="text-xs text-gray-500 mb-3">Thời lượng: {course.duration}</p>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-lg font-bold text-blue-600">{course.price > 0 ? `$${course.price}` : 'Free'}</span>
                                        <button
                                            onClick={() => handleViewDetails(course.courseId)}
                                            className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-100 transition-colors"
                                        >
                                            Xem Chi Tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold font-serif text-gray-800">Recent Activity</h2>
                            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {activities.map((act, i) => (
                                <div key={i} className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
                                    <div className={`w-12 h-12 rounded-lg ${act.color} flex items-center justify-center shrink-0 mr-4`}>
                                        <act.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{act.title}</h3>
                                        <p className="text-xs text-gray-500">{act.subtitle}</p>
                                    </div>
                                    <div className="text-sm font-medium text-gray-400">
                                        {act.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold font-serif text-gray-800 mb-4">Quick Links</h2>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                            {[
                                { title: "Learning Resources", icon: BookOpen },
                                { title: "Past Papers", icon: FileText },
                                { title: "System Support", icon: ShieldCheck },
                            ].map((link, i) => (
                                <button key={i} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium group">
                                    <link.icon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                    {link.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default StudentDashboardGeneral;