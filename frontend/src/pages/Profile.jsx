import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Camera,
    Edit3, BookOpen,
    ClipboardList, Settings, LogOut, Save, X,
    LayoutDashboard, Lock
} from 'lucide-react';
import authService from '../services/authService';
import userClient from '../api/userClient';
import MainLayout from '../layouts/MainLayout';



export default function ProfilePage() {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const location = useLocation(); // Hook lấy state từ router
    const navigate = useNavigate();

    // Check và hiện thông báo nếu được chuyển hướng từ VerifiedRoute
    useEffect(() => {
        if (location.state?.verificationError) {
            toast.warning(location.state.verificationError, { toastId: 'verify-redirect' });
            // Xóa state để không hiện lại khi reload (Optional)
            window.history.replaceState({}, document.title);
        }
    }, [location]);


    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        bio: '',
        qualifications: '',
        subjects: '',
        verificationDocument: '',
        verificationStatus: ''
    });

    const [previewImage, setPreviewImage] = useState(null);

    // --- STATE ĐỔI MẬT KHẨU ---
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Sử dụng userClient cho user-service API
                const res = await userClient.get('/me');

                const data = res.data;
                setUser(data);

                // Lưu vào localStorage để đồng bộ toàn cục
                localStorage.setItem('user', JSON.stringify(data));

                setFormData({
                    fullName: data.fullName || '',
                    phone: data.phone || '', // Sử dụng data thật từ DB
                    address: data.address || '',
                    bio: data.bio || '',
                    qualifications: data.teacherProfile?.qualifications || '',
                    subjects: data.teacherProfile?.subjects || '',
                    verificationDocument: data.teacherProfile?.verificationDocument || '',
                    verificationStatus: data.teacherProfile?.verificationStatus || 'NONE'
                });
            } catch (error) {
                console.error("Lỗi fetch profile:", error);
            } finally {
                // Thêm delay nhẹ để thấy Skeleton nếu mạng quá nhanh
                // setTimeout(() => setLoading(false), 500);
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Xử lý upload ảnh (Base64)
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64String = reader.result;

            try {
                const res = await userClient.put('/me', {
                    fullName: user?.fullName,
                    avatar: base64String
                });

                const updatedUser = res.data;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Cập nhật localStorage
                toast.success("Đổi ảnh đại diện thành công!");

            } catch (error) {
                console.error("Lỗi upload:", error);
                toast.error("Không thể kết nối server.");
            }
        };
    };

    // Xử lý upload tài liệu minh chứng (Base64)
    const handleDocumentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File quá lớn! Vui lòng chọn file dưới 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result;
            setFormData(prev => ({ ...prev, verificationDocument: base64String }));
            toast.info("Đã chọn file minh chứng. Hãy bấm Lưu để cập nhật.");
        };
    };

    const handleSave = async () => {
        try {
            const res = await userClient.put('/me', {
                fullName: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                bio: formData.bio,
                avatar: user?.avatar,
                qualifications: formData.qualifications,
                subjects: formData.subjects,
                verificationDocument: formData.verificationDocument
            });

            const updatedUser = res.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setIsEditing(false);
            toast.success("Cập nhật hồ sơ thành công!");
        } catch (error) {
            console.error("Lỗi API:", error);
            const errorMessage = error.response?.data?.errors
                ? Object.values(error.response.data.errors).join(", ")
                : (error.response?.data?.message || "Cập nhật thất bại, vui lòng kiểm tra lại thông tin.");
            toast.error(errorMessage);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.warning("Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsChangingPassword(true);
        try {
            await authService.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            });
            toast.success("Đổi mật khẩu thành công!");
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            const errorMsg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : "Lỗi khi đổi mật khẩu!");
            toast.error(errorMsg);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // --- SKELETON LOADER COMPONENT ---
    if (loading) return (
        <MainLayout>
            <div className="max-w-5xl mx-auto w-full animate-pulse">
                <div className="mb-8">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column Skeleton */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative h-80">
                            <div className="h-24 bg-gray-200"></div>
                            <div className="px-6 pb-6 text-center -mt-12 relative flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white"></div>
                                <div className="h-6 bg-gray-200 rounded w-32 mt-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 mt-2"></div>
                                <div className="mt-6 pt-6 border-t border-gray-100 w-full flex justify-center">
                                    <div className="flex flex-col items-center">
                                        <div className="h-8 bg-gray-200 rounded w-12"></div>
                                        <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex justify-between mb-8">
                                <div className="h-6 bg-gray-200 rounded w-32"></div>
                                <div className="h-8 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i}>
                                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                                    </div>
                                ))}
                                <div className="md:col-span-2">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-24 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );

    if (!user) return <div className="flex h-screen items-center justify-center text-red-500">Không tìm thấy thông tin User. Hãy kiểm tra Backend (User Service - Port 8081).</div>;

    return (
        <MainLayout>
            <div className="flex flex-col font-sans text-gray-900">
                {/* --- IMAGE PREVIEW MODAL --- */}
                {previewImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-4xl max-h-[90vh] p-2">
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
                            >
                                <X size={32} />
                            </button>
                            <img
                                src={previewImage}
                                alt="Avatar Full View"
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border-4 border-white/10"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}

                {/* --- MAIN CONTENT --- */}
                <div className="max-w-5xl mx-auto w-full">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">Quản lý Hồ sơ</h2>
                        <p className="text-gray-500 mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* --- CỘT TRÁI: THẺ THÔNG TIN --- */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                                <div className="px-6 pb-6 text-center -mt-12 relative">
                                    <div className="relative inline-block group">
                                        <div
                                            className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-blue-100 flex items-center justify-center overflow-hidden mx-auto cursor-pointer transition-transform hover:scale-105"
                                            onClick={() => user.avatar && setPreviewImage(user.avatar)}
                                        >
                                            {user.avatar ? (
                                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-blue-600">
                                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                                </span>
                                            )}
                                        </div>

                                        <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border border-gray-200 text-gray-600 hover:text-blue-600 cursor-pointer transition-transform hover:scale-110">
                                            <Camera size={16} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mt-3">{user.fullName}</h3>
                                    <p className="text-sm text-gray-500 font-medium">{user.role}</p>

                                    {/* Verification Status Badge */}
                                    {user.role === 'TEACHER' && (
                                        <div className="mt-2 flex justify-center">
                                            {formData.verificationStatus === 'APPROVED' && (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1">
                                                    ✅ Đã xác thực
                                                </span>
                                            )}
                                            {formData.verificationStatus === 'PENDING' && (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1">
                                                    ⏳ Đang chờ duyệt
                                                </span>
                                            )}
                                            {formData.verificationStatus === 'REJECTED' && (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 flex items-center gap-1">
                                                    ❌ Bị từ chối
                                                </span>
                                            )}
                                            {(formData.verificationStatus === 'NONE' || !formData.verificationStatus) && (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full border border-gray-200 flex items-center gap-1">
                                                    ⚪ Chưa xác thực
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                                        <div>
                                            <span className="block text-2xl font-bold text-blue-600">12</span>
                                            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Khóa học</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-50">Thông tin liên hệ</h4>
                                <ul className="space-y-4">
                                    <ContactItem icon={<Mail size={16} />} label="Email" value={user.email} color="bg-blue-50 text-blue-600" />
                                    <ContactItem icon={<Phone size={16} />} label="Điện thoại" value={formData.phone} color="bg-green-50 text-green-600" />
                                    <ContactItem icon={<MapPin size={16} />} label="Địa chỉ" value={formData.address} color="bg-purple-50 text-purple-600" />
                                </ul>
                            </div>
                        </div>

                        {/* --- CỘT PHẢI: FORM CHỈNH SỬA --- */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-800">Thông tin chi tiết</h3>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                                        >
                                            <Edit3 size={16} /> Chỉnh sửa
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput
                                            label="Họ và tên"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                        />
                                        <FormInput
                                            label="Số điện thoại"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                        />
                                        <FormInput
                                            label="Địa chỉ"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />

                                        {/* --- TEACHER ONLY FIELDS --- */}
                                        {user.role === 'TEACHER' && (
                                            <>
                                                <div className="md:col-span-2">
                                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 mb-4">
                                                        <div className="text-yellow-600 mt-0.5">⚠️</div>
                                                        <div className="text-sm text-yellow-800">
                                                            <span className="font-bold">Lưu ý:</span>
                                                            <br />
                                                            Thay đổi Bằng cấp/Môn dạy sẽ cần duyệt lại. Hồ sơ có thể bị tạm khóa.
                                                        </div>
                                                    </div>
                                                </div>

                                                <FormInput
                                                    label="Bằng cấp / Chứng chỉ"
                                                    name="qualifications"
                                                    value={formData.qualifications}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    placeholder="Ví dụ: PhD Mathematics, B.Ed..."
                                                />
                                                <FormInput
                                                    label="Môn giảng dạy"
                                                    name="subjects"
                                                    value={formData.subjects}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    placeholder="Ví dụ: Math Core, Math Extended..."
                                                />

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Minh chứng năng lực (Ảnh/PDF)</label>
                                                    <div className="flex items-center gap-4">
                                                        {isEditing && (
                                                            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                                                                <Camera size={16} />
                                                                Chọn File
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    className="hidden"
                                                                    onChange={handleDocumentUpload}
                                                                />
                                                            </label>
                                                        )}

                                                        {formData.verificationDocument ? (
                                                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                                                <span>Đã có minh chứng</span>
                                                                <a
                                                                    href={formData.verificationDocument}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="underline font-bold hover:text-green-800"
                                                                >
                                                                    Xem
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Chưa có tài liệu minh chứng</span>
                                                        )}
                                                    </div>
                                                </div>


                                            </>
                                        )}

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu bản thân</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                rows={4}
                                                className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${isEditing
                                                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                                                    : 'border-transparent bg-gray-50 text-gray-600 resize-none'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {isEditing && (
                                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 animate-fade-in">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        fullName: user.fullName || '',
                                                        phone: user.phone || '',
                                                        address: user.address || '',
                                                        bio: user.bio || '',
                                                        qualifications: user.qualifications || '',
                                                        subjects: user.subjects || '',
                                                        verificationDocument: user.verificationDocument || ''
                                                    });
                                                    setIsEditing(false);
                                                }}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                                            >
                                                <X size={18} /> Hủy bỏ
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform active:scale-95"
                                            >
                                                <Save size={18} /> Lưu thay đổi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Settings */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Cài đặt tài khoản</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h5 className="font-medium text-gray-800">Đổi mật khẩu</h5>
                                            <p className="text-xs text-gray-500">Nên thay đổi định kỳ để bảo mật</p>
                                        </div>
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white hover:border-blue-500 hover:text-blue-600 transition"
                                        >
                                            Cập nhật
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* --- MODAL ĐỔI MẬT KHẨU --- */}
                {showPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Lock size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Đổi mật khẩu</h3>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        name="oldPassword"
                                        required
                                        value={passwordData.oldPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform active:scale-95 disabled:bg-blue-400"
                                    >
                                        {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// --- SUB-COMPONENTS (Tách nhỏ để code gọn) ---

function ContactItem({ icon, label, value, color }) {
    return (
        <li className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-700">{value || "Chưa cập nhật"}</p>
            </div>
        </li>
    );
}

function FormInput({ label, name, value, onChange, disabled, fullWidth = false, placeholder = "" }) {
    return (
        <div className={fullWidth ? "md:col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${disabled
                    ? 'border-transparent bg-gray-50 text-gray-600'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                    }`}
            />
        </div>
    );
}
