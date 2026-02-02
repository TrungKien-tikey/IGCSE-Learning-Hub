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

// Custom Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 mb-6">{message}</p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? "Đang xử lý..." : "Xác nhận hủy"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [studentEmail, setStudentEmail] = useState("");
    const [children, setChildren] = useState([]); // List of linked children
    const [selectedChildId, setSelectedChildId] = useState(null); // Currently selected child ID
    const [isSearching, setIsSearching] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false); // To toggle Add Student form

    // Modal State
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);

    // Fetch initial list of children
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                // Fetch persistent list from Backend
                const res = await axiosClient.get('/relationships/children-details', {
                    baseURL: '/api/users'
                });

                // Response structure: [{ relationship: {...}, student: {...} }]
                const students = res.data.map(item => item.student);

                if (students.length > 0) {
                    setChildren(students);

                    // Restore selection or default to first
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

    // Save selection preference
    useEffect(() => {
        if (selectedChildId) {
            localStorage.setItem("lastSelectedChildId", selectedChildId);
        }
    }, [selectedChildId]);

    // Get selected student object
    const linkedStudent = children.find(c => c.userId === selectedChildId);

    // Sử dụng hook lấy dữ liệu nếu đã liên kết và có chọn bé
    const { statistics, insights, recommendations, loading: dataLoading, error: dataError } =
        useStudentData(linkedStudent?.userId);

    const handleLinkStudent = async (e) => {
        e.preventDefault();
        if (!studentEmail) return;

        setIsSearching(true);

        try {
            console.log(">>> [Connect] Connecting with code:", studentEmail);
            const res = await axiosClient.post('/relationships/connect-by-code',
                { linkCode: studentEmail },
                { baseURL: '/api/users' }
            );

            const relationship = res.data;
            if (relationship && relationship.status === 'ACCEPTED') {
                // 1. Fetch Student Detail
                const studentId = relationship.studentId;
                const studentRes = await axiosClient.get(`/${studentId}`, { baseURL: '/api/users' });
                const newStudent = studentRes.data;

                // 2. Add to list (Check duplicate)
                setChildren(prev => {
                    if (prev.some(c => c.userId === newStudent.userId)) return prev;
                    return [...prev, newStudent];
                });

                // 3. Select new student
                setSelectedChildId(newStudent.userId);

                // 4. Update LocalStorage (Legacy support for single student - or migrate to list later)
                localStorage.setItem("linkedStudent", JSON.stringify(newStudent));

                setStudentEmail("");
                setShowAddForm(false);
                toast.success(`Kết nối thành công với ${newStudent.fullName}!`);
            } else {
                toast.error("Kết nối chưa được chấp thuận (Status: " + relationship?.status + ")");
            }
        } catch (err) {
            const msg = err.response?.data || "Lỗi kết nối hoặc mã không hợp lệ.";
            // If msg is object, try to extract message
            const errorText = typeof msg === 'string' ? msg : (msg.message || "Mã liên kết không đúng hoặc lỗi hệ thống.");
            toast.error(errorText);
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

            // Remove from local list
            const newChildren = children.filter(c => c.userId !== selectedChildId);
            setChildren(newChildren);

            // Select another child or reset
            if (newChildren.length > 0) {
                setSelectedChildId(newChildren[0].userId);
            } else {
                setSelectedChildId(null);
                setShowAddForm(false);
                localStorage.removeItem("linkedStudent");
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
                                <h2 className="text-2xl font-bold text-gray-900">AI Learning Insights for Parent</h2>
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
                                            onClick={() => navigate(`/ai/dashboard/parent/${linkedStudent.userId}`)}
                                            className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                                        >
                                            Xem chi tiết tiến độ
                                        </button>
                                        <button
                                            onClick={() => navigate(`/ai/dashboard/parent/${linkedStudent.userId}`)}
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

                {/* Modal Component Instance */}
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
