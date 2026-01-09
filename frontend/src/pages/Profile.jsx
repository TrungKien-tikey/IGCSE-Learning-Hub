import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Camera,
    Edit3, BookOpen,
    ClipboardList, Settings, LogOut, Save, X,
    LayoutDashboard
} from 'lucide-react';

export default function ProfilePage() {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // State form chỉnh sửa
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        bio: ''
    });

    const [previewImage, setPreviewImage] = useState(null);

    const currentUserId = 1;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`http://localhost:8082/api/users/${currentUserId}`);
                if (!res.ok) throw new Error("Không thể tải dữ liệu");
                const data = await res.json();

                setUser(data);
                setFormData({
                    fullName: data.fullName || '',
                    phone: '0987654321',
                    address: 'Hà Nội, Việt Nam',
                    bio: 'Học viên chăm chỉ tại IGCSE Learning Hub'
                });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Xử lý upload ảnh (Base64)
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert file sang Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64String = reader.result;

            try {
                // Gửi lên Backend
                const res = await fetch(`http://localhost:8082/api/users/${currentUserId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: user?.fullName, // Giữ nguyên tên cũ
                        avatar: base64String      // Cập nhật avatar mới
                    })
                });

                if (res.ok) {
                    const updatedUser = await res.json();
                    setUser(updatedUser);
                    alert("Đổi ảnh đại diện thành công!");
                } else {
                    alert("Lỗi khi upload ảnh!");
                }

            } catch (error) {
                console.error("Lỗi upload:", error);
                alert("Không thể kết nối server.");
            }
        };
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`http://localhost:8082/api/users/${currentUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    avatar: user?.avatar // Giữ nguyên avatar cũ khi đổi tên
                })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setIsEditing(false);
                alert("Cập nhật hồ sơ thành công!");
            } else {
                alert("Lỗi khi lưu dữ liệu!");
            }
        } catch (error) {
            console.error("Lỗi API:", error);
            alert("Không thể kết nối đến server.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-blue-600 font-bold">Đang tải dữ liệu...</div>;
    if (!user) return <div className="flex h-screen items-center justify-center text-red-500">Không tìm thấy thông tin User. Hãy kiểm tra Backend (Port 8082).</div>;

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">

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

            {/* --- SIDEBAR --- */}
            <aside className="w-64 bg-white shadow-xl hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                        <BookOpen className="w-8 h-8" /> IGCSE Hub
                    </h1>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Trang chủ" />
                    <NavItem icon={<BookOpen size={20} />} label="Khóa học" />
                    <NavItem icon={<ClipboardList size={20} />} label="Bài kiểm tra" />
                    <NavItem icon={<User size={20} />} label="Hồ sơ cá nhân" active />
                    <NavItem icon={<Settings size={20} />} label="Cài đặt" />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
                        <LogOut size={20} /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 p-4 md:p-10">
                <div className="max-w-5xl mx-auto">
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
                                        {/* Avatar Display */}
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

                                        {/* Camera Button (Upload) */}
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

                                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-2xl font-bold text-blue-600">12</span>
                                            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Khóa học</span>
                                        </div>
                                        <div>
                                            <span className="block text-2xl font-bold text-indigo-600">8.5</span>
                                            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Điểm TB</span>
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
                                                onClick={() => setIsEditing(false)}
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
                                        <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition">Cập nhật</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- SUB-COMPONENTS (Tách nhỏ để code gọn) ---

function NavItem({ icon, label, active = false }) {
    return (
        <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${active
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
            }`}>
            {icon} {label}
        </a>
    );
}

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

function FormInput({ label, name, value, onChange, disabled, fullWidth = false }) {
    return (
        <div className={fullWidth ? "md:col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${disabled
                    ? 'border-transparent bg-gray-50 text-gray-600'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                    }`}
            />
        </div>
    );
}
