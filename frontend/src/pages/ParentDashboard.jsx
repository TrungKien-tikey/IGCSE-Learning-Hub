import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
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

// Import Component con (Nhớ điều chỉnh đường dẫn nếu bạn đặt file ở thư mục khác)
import StatCard from '../components/common/StatCard';
import ConfirmationModal from '../components/common/ConfirmationModal';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [studentEmail, setStudentEmail] = useState("");
    const [children, setChildren] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // State cho tiến độ khóa học
    const [coursesProgress, setCoursesProgress] = useState([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    // Modal State
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);

    // --- LOGIC GỌI API ---

    // 1. Fetch danh sách con (Chạy 1 lần khi load trang)
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await axiosClient.get('/relationships/children-details', {
                    baseURL: '/api/users'
                });
                
                // API trả về [{ relationship:..., student:... }] -> lấy student
                const students = res.data.map(item => item.student);

                if (students.length > 0) {
                    setChildren(students);

                    // Khôi phục bé đang chọn từ localStorage hoặc chọn bé đầu tiên
                    const lastSelectedId = localStorage.getItem("lastSelectedChildId");
                    if (lastSelectedId && students.some(s => s.userId === Number(lastSelectedId))) {
                        setSelectedChildId(Number(lastSelectedId));
                    } else {
                        setSelectedChildId(students[0].userId);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch children", err);
                toast.error("Không thể tải danh sách học sinh.");
            }
        };
        fetchChildren();
    }, []);

    // Derived State: Tìm object học sinh đang chọn
    const linkedStudent = children.find(c => c.userId === selectedChildId);

    // 2. Fetch Tiến độ khóa học (Chạy mỗi khi đổi con)
    const fetchStudentProgress = async (studentId) => {
        setIsLoadingProgress(true);
        try {
            const res = await axiosClient.get(`/courses/student/${studentId}/summary`);
            setCoursesProgress(res.data);
        } catch (error) {
            console.error("Lỗi lấy tiến độ:", error);
        } finally {
            setIsLoadingProgress(false);
        }
    };

    useEffect(() => {
        if (linkedStudent?.userId) {
            // Lưu preference
            localStorage.setItem("lastSelectedChildId", linkedStudent.userId);
            // Gọi API tiến độ
            fetchStudentProgress(linkedStudent.userId);
        }
    }, [linkedStudent]);

    // Hook AI Data
    const { statistics, insights, recommendations, loading: dataLoading, error: dataError } =
        useStudentData(linkedStudent?.userId);

    // --- HANDLERS ---

    const handleLinkStudent = async (e) => {
        e.preventDefault();
        if (!studentEmail) return;

        setIsSearching(true);
        try {
            const res = await axiosClient.post('/relationships/connect-by-code',
                { linkCode: studentEmail },
                { baseURL: '/api/users' }
            );

            const relationship = res.data;
            if (relationship && relationship.status === 'ACCEPTED') {
                const studentId = relationship.studentId;
                const studentRes = await axiosClient.get(`/${studentId}`, { baseURL: '/api/users' });
                const newStudent = studentRes.data;

                setChildren(prev => {
                    if (prev.some(c => c.userId === newStudent.userId)) return prev;
                    return [...prev, newStudent];
                });

                setSelectedChildId(newStudent.userId);
                setStudentEmail("");
                setShowAddForm(false);
                toast.success(`Kết nối thành công với ${newStudent.fullName}!`);
            } else {
                toast.error("Kết nối chưa được chấp thuận (Status: " + relationship?.status + ")");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Mã liên kết không đúng hoặc lỗi hệ thống.";
            toast.error(msg);
        } finally {
            setIsSearching(false);
        }
    };

    const confirmUnlink = async () => {
        setIsUnlinking(true);
        try {
            await axiosClient.delete('/relationships/disconnect', {
                data: { studentId: selectedChildId },
                baseURL: '/api/users'
            });

            const newChildren = children.filter(c => c.userId !== selectedChildId);
            setChildren(newChildren);

            if (newChildren.length > 0) {
                setSelectedChildId(newChildren[0].userId);
            } else {
                setSelectedChildId(null);
                setShowAddForm(false);
            }
            toast.success("Đã hủy liên kết thành công.");
            setIsUnlinkModalOpen(false);
        } catch (err) {
            toast.error("Lỗi khi hủy liên kết: " + err.message);
        } finally {
            setIsUnlinking(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Parent <span className="text-indigo-600">Dashboard</span>
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Chào mừng bạn trở lại, hệ thống giám sát học tập dành cho Phụ huynh.
                        </p>
                    </div>
                </div>

                {/* --- MULTI STUDENT SWITCHER --- */}
                {children.length > 0 && (
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 border-b border-gray-100">
                        {children.map(child => (
                            <button
                                key={child.userId}
                                onClick={() => {
                                    setSelectedChildId(child.userId);
                                    setShowAddForm(false);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${selectedChildId === child.userId && !showAddForm
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedChildId === child.userId ? "bg-white text-indigo-600" : "bg-indigo-100 text-indigo-600"
                                    }`}>
                                    {child.fullName?.charAt(0) || 'S'}
                                </div>
                                <span className="text-sm font-medium whitespace-nowrap">{child.fullName}</span>
                            </button>
                        ))}

                        <button
                            onClick={() => setShowAddForm(true)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-full border border-dashed border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm ${showAddForm ? "bg-indigo-50 border-indigo-400 text-indigo-600" : ""
                                }`}
                        >
                            <span className="text-lg leading-none mb-0.5">+</span> Thêm bé
                        </button>
                    </div>
                )}

                {/* --- MAIN CONTENT AREA --- */}
                {(!linkedStudent || showAddForm) ? (
                    /* Link Student Form */
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto text-center mt-6 animate-fade-in-up">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <BookOpen className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {children.length > 0 ? "Thêm tài khoản con khác" : "Liên kết với tài khoản con"}
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Nhập <b>Mã liên kết</b> (Link Code) từ trang Profile của con để kết nối.
                        </p>

                        <form onSubmit={handleLinkStudent} className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Nhập mã (VD: HS-123456)"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium uppercase placeholder:normal-case"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                {children.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="w-1/3 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Hủy
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:bg-indigo-400 flex items-center justify-center gap-2"
                                >
                                    {isSearching ? "Đang xử lý..." : (
                                        <>
                                            <CheckCircle size={18} /> Kết nối ngay
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Full Dashboard View for Selected Student */
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
                                onClick={() => setIsUnlinkModalOpen(true)}
                                className="text-gray-400 hover:text-red-500 transition-colors text-sm font-medium border border-gray-200 px-4 py-2 rounded-lg hover:border-red-100 hover:bg-red-50"
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
                                <h2 className="text-2xl font-bold text-gray-900">AI Learning Insights</h2>
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

                        {/* 3. Tiến độ học tập & Thông báo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Cột trái: Thông báo */}
                            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Bell size={18} className="text-amber-500" /> Thông báo mới nhất
                                </h4>
                                <div className="space-y-4">
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
                                        Hệ thống: Vừa cập nhật tiến độ học tập mới.
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
                                        Gợi ý: Nhắc con hoàn thành bài tập về nhà.
                                    </div>
                                </div>
                            </div>

                            {/* Cột phải: Tiến độ khóa học */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Banner báo cáo tuần */}
                                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">Báo cáo chi tiết AI</h3>
                                            <p className="text-indigo-100 text-sm">Xem phân tích sâu về điểm mạnh/yếu của con.</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/ai/dashboard/parent/${linkedStudent.userId}`)}
                                            className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap"
                                        >
                                            Xem báo cáo
                                        </button>
                                    </div>
                                    <BarChart3 className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                                </div>

                                {/* List khóa học */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                        Tiến độ các khóa học
                                    </h3>

                                    {isLoadingProgress ? (
                                        <p className="text-gray-500">Đang tải dữ liệu...</p>
                                    ) : coursesProgress.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {coursesProgress.map((course) => (
                                                <div key={course.courseId} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-semibold text-gray-800">{course.courseTitle}</h4>
                                                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                                {Math.round(course.progress)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 whitespace-nowrap text-right">
                                                        {course.completedLessons}/{course.totalLessons} bài
                                                        {course.progress === 100 && <span className="block text-green-600 font-bold mt-1">Hoàn thành</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                            <p className="text-gray-500">Bé chưa đăng ký khóa học nào.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmationModal
                    isOpen={isUnlinkModalOpen}
                    onClose={() => setIsUnlinkModalOpen(false)}
                    onConfirm={confirmUnlink}
                    isLoading={isUnlinking}
                    title="Xác nhận hủy liên kết"
                    message="Bạn có chắc muốn hủy liên kết với học sinh này? Dữ liệu sẽ được ẩn đi, ban có thể khôi phục bằng cách nhập lại Mã kết nối."
                />
            </div>
        </MainLayout>
    );
};

export default ParentDashboard;