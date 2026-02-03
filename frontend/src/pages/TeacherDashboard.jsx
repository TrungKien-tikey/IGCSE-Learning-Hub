import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import userClient from '../api/userClient';
import { getTeacherSlots } from '../api/paymentService';
import {
    Users, BookOpen, Clock, CheckCircle,
    BarChart3, PlusCircle, ArrowRight,
    Edit, Trash2, Eye, EyeOff, BookMarked, FileText
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate, Link } from 'react-router-dom';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherName = storedUser.fullName || "Giáo viên";
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho slot availability
    const [teacherId, setTeacherId] = useState(storedUser.userId || storedUser.id);
    const [availableSlots, setAvailableSlots] = useState(0);
    const [slotsLoading, setSlotsLoading] = useState(true);

    // State cho Modal Sửa/Thêm Khóa học
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        title: '', description: '', price: '', duration: ''
    });

    const API_URL = '/api/courses';

    // Fetch teacher slots
    const fetchTeacherSlots = async () => {
        try {
            let userId = teacherId;
            if (!userId) {
                const userRes = await userClient.get('/me');
                userId = userRes.data?.userId || userRes.data?.id;
                setTeacherId(userId);
            }

            if (userId) {
                const slotsRes = await getTeacherSlots(userId);
                setAvailableSlots(slotsRes?.availableSlots || 0);
            }
        } catch (err) {
            console.error('Error fetching slots:', err);
            setAvailableSlots(0);
        } finally {
            setSlotsLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`${API_URL}/teacher`);
            console.log("Teacher courses logic - Data:", response.data);
            setCourses(response.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách lớp học - Chi tiết:", {
                message: err.message,
                status: err.response?.status,
                url: err.config?.url,
                baseURL: err.config?.baseURL,
                fullURL: (err.config?.baseURL || '') + (err.config?.url || '')
            });
            if (err.response && err.response.status === 401) {
                toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
                navigate('/login');
            } else if (err.response && err.response.status === 404) {
                toast.error(`Lỗi 404: Không tìm thấy đường dẫn ${err.config?.url}. Kiểm tra cấu hình Backend/Kong.`);
            } else {
                toast.error("Lỗi khi tải danh sách lớp học. Vui lòng thử lại!");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchTeacherSlots();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const openAddModal = () => {
        setFormData({ title: '', description: '', price: '', duration: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (e, course) => {
        e.stopPropagation();
        setFormData({
            title: course.title,
            description: course.description,
            price: course.price,
            duration: course.duration || ''
        });
        setCurrentId(course.courseId);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await axiosClient.put(`${API_URL}/${currentId}`, formData);
            } else {
                await axiosClient.post(API_URL, formData);
            }
            fetchCourses();
            fetchTeacherSlots(); // Cập nhật lại số suất học hiển thị
            closeModal();
        } catch (err) {
            console.error("Lỗi lưu khóa học:", err);
            toast.error("Lỗi: " + (err.response?.data || err.message));
        }
    };

    const handleDelete = async (e, courseId) => {
        e.stopPropagation();
        if (window.confirm("Bạn chắc chắn xóa khóa học này?")) {
            try {
                await axiosClient.delete(`${API_URL}/${courseId}`);
                setCourses(prev => prev.filter(c => c.courseId !== courseId));
                fetchTeacherSlots(); // Hoàn trả lại 1 suất khi xóa
            } catch (err) {
                toast.error("Không thể xóa (Có thể do ràng buộc dữ liệu)!");
            }
        }
    };

    const handleDeactivate = async (e, courseId) => {
        e.stopPropagation();
        if (window.confirm("Bạn muốn ẩn khóa học này (Vô hiệu hóa)?")) {
            try {
                await axiosClient.delete(`${API_URL}/${courseId}/deactivate`);
                fetchCourses();
            } catch (err) {
                toast.error("Lỗi: Không thể vô hiệu hóa.");
            }
        }
    };

    const handleActivate = async (e, courseId) => {
        e.stopPropagation();
        try {
            await axiosClient.put(`${API_URL}/${courseId}/activate`, {});
            fetchCourses();
        } catch (err) {
            toast.error("Lỗi hiện khóa học");
        }
    };

    // Tính toán thống kê thật từ data đã load
    const stats = [
        { title: "Khóa học đang dạy", value: courses.length.toString(), icon: BookOpen, color: "bg-blue-500", subtitle: "Hoạt động" },
        { title: "Bài học đã soạn", value: courses.reduce((acc, c) => acc + (c.lessonCount || 0), 0).toString(), icon: BookMarked, color: "bg-indigo-500", subtitle: "Nội dung" },
        { title: "Học sinh ghi danh", value: courses.reduce((acc, c) => acc + (c.studentCount || 0), 0).toString(), icon: Users, color: "bg-emerald-500", subtitle: "Tổng số" },
        { title: "Lượt truy cập", value: courses.reduce((acc, c) => acc + (c.viewCount || 0), 0).toString(), icon: BarChart3, color: "bg-amber-500", subtitle: "Hôm nay" },
    ];

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-10 p-2 md:p-6">

                {/* 1. Header & Welcome */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Chào mừng trở lại, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{teacherName}</span>!
                        </h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Hệ thống quản lý giảng dạy thông minh đã sẵn sàng.
                        </p>
                    </div>
                </header>

                {/* 2. Real Stats Grid (Style from AI Dashboard) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.color} shadow-lg shadow-${stat.color.split('-')[1]}-100`}>
                                    <stat.icon size={24} className="text-white" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.subtitle}</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* 3. Main Course Management (Quản lý giảng dạy style) */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Quản lý Khóa học & Lớp học
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Danh sách các khóa học do bạn trực tiếp giảng dạy và quản lý.
                                {!slotsLoading && (
                                    <span className={`ml-2 font-semibold ${availableSlots > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        (Còn {availableSlots} suất học)
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={openAddModal}
                                disabled={availableSlots <= 0}
                                className={`px-6 py-2.5 rounded-xl font-bold transition shadow-lg flex items-center gap-2 text-sm ${availableSlots > 0
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                title={availableSlots <= 0 ? 'Bạn cần mua gói suất học để tạo khóa mới' : ''}
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tạo Khóa Học Mới
                            </button>
                            {availableSlots <= 0 && !slotsLoading && (
                                <Link
                                    to="/teacher/buy-slots"
                                    className="text-indigo-600 text-sm font-medium hover:underline"
                                >
                                    👉 Mua gói suất học
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                <p className="text-slate-400 font-medium">Đang tải dữ liệu...</p>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="p-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                                <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                                    <BookMarked className="w-16 h-16 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có khóa học nào</h3>
                                <p className="text-slate-500 max-w-sm mb-8">
                                    {availableSlots > 0
                                        ? 'Bắt đầu hành trình giảng dạy bằng cách tạo lớp học/khóa học đầu tiên của bạn ngay hôm nay.'
                                        : 'Bạn cần mua gói suất học trước khi tạo khóa học mới.'
                                    }
                                </p>
                                {availableSlots > 0 ? (
                                    <button
                                        onClick={openAddModal}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-100"
                                    >
                                        Thêm lớp học đầu tiên
                                    </button>
                                ) : (
                                    <Link
                                        to="/teacher/buy-slots"
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-100"
                                    >
                                        👉 Mua gói suất học
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map((course) => (
                                    <div
                                        key={course.courseId}
                                        className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden"
                                    >
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${course.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                    {course.active ? '● Đang hiển thị' : '○ Đang ẩn'}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => openEditModal(e, course)} className="p-1.5 hover:bg-amber-50 text-amber-500 rounded-lg transition-colors" title="Sửa"><Edit size={16} /></button>
                                                    <button onClick={(e) => handleDelete(e, course.courseId)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors" title="Xóa"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2" title={course.title}>
                                                {course.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm line-clamp-2 min-h-[40px] mb-6">
                                                {course.description || "Chưa có mô tả chi tiết cho lớp học này."}
                                            </p>

                                            <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                                <span className="text-indigo-600 font-extrabold">{course.price ? `${Number(course.price).toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</span>
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                                                    <Clock size={14} />
                                                    {course.duration || '--'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex gap-2">
                                            <button
                                                onClick={() => navigate(`/courses/${course.courseId}/lessons`)}
                                                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <BookOpen size={16} />
                                                Quản lý bài dạy
                                            </button>
                                            <button
                                                onClick={() => navigate(`/ai/dashboard/teacher?classId=${course.courseId}`)}
                                                className="w-12 h-[42px] bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="Xem Insights"
                                            >
                                                <BarChart3 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal Popup */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="text-lg font-bold">{isEditing ? 'Cập Nhật Khóa Học' : 'Thêm Mới Khóa Học'}</h3>
                            <button onClick={closeModal} className="text-white hover:text-slate-200 transition-colors">
                                <PlusCircle className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Tên khóa học</label>
                                    <input name="title" value={formData.title} onChange={handleInputChange} className="form-input" required placeholder="VD: Toán Cambridge IGCSE" />
                                </div>
                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="form-textarea" placeholder="Mô tả ngắn về khóa học..." />
                                </div>
                                <div className="flex gap-4">
                                    <div className="form-group flex-1">
                                        <label>Giá (VNĐ)</label>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="form-input" placeholder="VD: 500000" step="10000" />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Thời lượng</label>
                                        <input name="duration" value={formData.duration} onChange={handleInputChange} className="form-input" placeholder="VD: 3 tháng" required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={closeModal} className="btn-cancel hover:bg-slate-200 transition-colors">Hủy</button>
                                <button type="submit" className="btn-submit hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">Lưu Lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
