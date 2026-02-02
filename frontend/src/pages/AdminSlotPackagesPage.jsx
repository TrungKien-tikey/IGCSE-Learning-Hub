import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Package, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
    DollarSign, Clock, Users, X, Check, AlertCircle
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import {
    getAllPackages,
    createPackage,
    updatePackage,
    deletePackage,
    togglePackageStatus
} from '../api/paymentService';

// Format tiền VNĐ
const formatCurrency = (value) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

export default function AdminSlotPackagesPage() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slotCount: 5,
        price: 500000,
        durationDays: 365,
        isActive: true
    });

    // Fetch packages
    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await getAllPackages();
            setPackages(data || []);
        } catch (error) {
            console.error('Error fetching packages:', error);
            toast.error('Lỗi tải danh sách gói suất học!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                (name === 'slotCount' || name === 'price' || name === 'durationDays')
                    ? (value === '' ? '' : Number(value))
                    : value
        }));
    };

    const openAddModal = () => {
        setFormData({
            name: '',
            description: '',
            slotCount: 5,
            price: 500000,
            durationDays: 365,
            isActive: true
        });
        setIsEditing(false);
        setCurrentId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (pkg) => {
        setFormData({
            name: pkg.name,
            description: pkg.description || '',
            slotCount: pkg.slotCount,
            price: pkg.price,
            durationDays: pkg.durationDays || 365,
            isActive: pkg.isActive
        });
        setCurrentId(pkg.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.slotCount || !formData.price) {
            toast.error('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            if (isEditing && currentId) {
                await updatePackage(currentId, formData);
                toast.success('Cập nhật gói thành công!');
            } else {
                await createPackage(formData);
                toast.success('Tạo gói mới thành công!');
            }
            fetchPackages();
            closeModal();
        } catch (error) {
            console.error('Error saving package:', error);
            toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc muốn ẩn gói "${name}"?`)) {
            try {
                await deletePackage(id);
                toast.success('Đã ẩn gói suất học!');
                fetchPackages();
            } catch (error) {
                toast.error('Lỗi xóa gói!');
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const result = await togglePackageStatus(id);
            toast.success(result.message);
            fetchPackages();
        } catch (error) {
            toast.error('Lỗi thay đổi trạng thái!');
        }
    };

    // Stats
    const stats = [
        {
            title: 'Tổng gói suất học',
            value: packages.length,
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            title: 'Gói đang bán',
            value: packages.filter(p => p.isActive).length,
            icon: Check,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            title: 'Gói đã ẩn',
            value: packages.filter(p => !p.isActive).length,
            icon: AlertCircle,
            color: 'text-slate-600',
            bg: 'bg-slate-100'
        }
    ];

    return (
        <MainLayout>
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="w-7 h-7 text-indigo-600" />
                            Quản Lý Gói Suất Học
                        </h1>
                        <p className="text-slate-500 mt-1">Tạo và quản lý các gói suất học để bán cho giáo viên</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Gói Mới
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">{stat.title}</p>
                        </div>
                    ))}
                </div>

                {/* Packages Grid */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="font-semibold text-slate-800">Danh sách gói suất học</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-slate-400 mt-2">Đang tải...</p>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Chưa có gói suất học nào</p>
                            <button
                                onClick={openAddModal}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Tạo gói đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {packages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className={`p-4 rounded-xl border-2 transition-all ${pkg.isActive
                                            ? 'border-emerald-200 bg-emerald-50/30 hover:shadow-md'
                                            : 'border-slate-200 bg-slate-50/50 opacity-70'
                                        }`}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pkg.isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {pkg.isActive ? '● Đang bán' : '○ Đã ẩn'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleToggleStatus(pkg.id)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                                                title={pkg.isActive ? 'Ẩn gói' : 'Bật gói'}
                                            >
                                                {pkg.isActive ? (
                                                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(pkg)}
                                                className="p-1.5 hover:bg-amber-50 rounded-lg transition"
                                                title="Sửa"
                                            >
                                                <Edit2 className="w-4 h-4 text-amber-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pkg.id, pkg.name)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Name & Description */}
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{pkg.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                        {pkg.description || 'Không có mô tả'}
                                    </p>

                                    {/* Details */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                Số suất học
                                            </span>
                                            <span className="font-bold text-indigo-600">{pkg.slotCount} suất</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                Giá bán
                                            </span>
                                            <span className="font-bold text-emerald-600">{formatCurrency(pkg.price)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                Thời hạn
                                            </span>
                                            <span className="font-medium text-slate-700">{pkg.durationDays} ngày</span>
                                        </div>
                                    </div>

                                    {/* Price per slot */}
                                    <div className="bg-indigo-50 p-2 rounded-lg text-center">
                                        <span className="text-xs text-indigo-600 font-medium">
                                            ~ {formatCurrency(pkg.price / pkg.slotCount)} / suất
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <h3 className="font-bold text-lg">
                                {isEditing ? '✏️ Sửa Gói Suất Học' : '➕ Tạo Gói Mới'}
                            </h3>
                            <button onClick={closeModal} className="hover:bg-indigo-700 p-1 rounded transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tên gói <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="VD: Gói 5 suất học"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Mô tả ngắn về gói..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Số suất học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="slotCount"
                                            value={formData.slotCount}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Giá (VNĐ) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            step="10000"
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Thời hạn (ngày)
                                    </label>
                                    <input
                                        type="number"
                                        name="durationDays"
                                        value={formData.durationDays}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <label className="text-sm text-slate-700">
                                        Kích hoạt ngay (cho phép bán)
                                    </label>
                                </div>

                                {/* Preview */}
                                {formData.slotCount > 0 && formData.price > 0 && (
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-sm text-slate-600">
                                            💡 <strong>{formData.name || 'Gói'}</strong>: {formData.slotCount} suất với giá {formatCurrency(formData.price)}
                                            <br />
                                            <span className="text-indigo-600">
                                                ≈ {formatCurrency(formData.price / formData.slotCount)} / suất
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                                >
                                    {isEditing ? 'Lưu thay đổi' : 'Tạo gói'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
