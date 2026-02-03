import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import MainLayout from '../../layouts/MainLayout';
import { toast } from 'react-toastify';
import { Check, X, FileText, Search, Filter, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

// Custom Skeleton Component
const TableSkeleton = () => (
    <>
        {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse border-b border-gray-100">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                </td>
            </tr>
        ))}
    </>
);

export default function TeacherVerification() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING'); // OFF, PENDING, APPROVED, REJECTED
    const [searchTerm, setSearchTerm] = useState('');

    // Preview Image State
    const [previewImage, setPreviewImage] = useState(null);

    const isImage = (url) => {
        if (!url) return false;
        if (url.startsWith('data:image/')) return true; // Base64 check
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
    };

    const handleOpenFile = (url) => {
        if (!url) return;

        // If it's not base64, open directly
        if (!url.startsWith('data:')) {
            window.open(url, '_blank');
            return;
        }

        // Convert Base64 to Blob for modern browser support
        try {
            const arr = url.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (e) {
            console.error("Error opening file:", e);
            // Fallback
            const win = window.open();
            win.document.write('<iframe src="' + url + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            // Fetch all TEACHERS. Backend supports filtering by role.
            const res = await axiosClient.get('/api/users', {
                params: { role: 'TEACHER', size: 100 }, // Fetch 100 teachers max for now
            });
            // The response from existing API is Page<User> object
            setTeachers(res.data.content || []);
        } catch (error) {
            console.error("Error fetching teachers:", error);
            toast.error("Không thể lấy danh sách giáo viên.");
        } finally {
            setLoading(false);
        }
    };

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, status: null, name: '' });

    const handleVerify = (userId, status, fullName) => {
        setConfirmModal({
            isOpen: true,
            userId,
            status,
            name: fullName
        });
    };

    const confirmAction = async () => {
        const { userId, status } = confirmModal;
        if (!userId) return;

        try {
            await axiosClient.put(`/api/users/${userId}/verify`, null, {
                params: { status }
            });
            toast.success(`Đã đánh dấu: ${status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}`);
            fetchTeachers(); // Refresh list
            setConfirmModal({ isOpen: false, userId: null, status: null, name: '' });
        } catch (error) {
            console.error("Error verifying teacher:", error);
            toast.error("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    // Filter Logic
    const filteredTeachers = teachers.filter(t => {
        const profile = t.teacherProfile || {};
        const status = profile.verificationStatus || 'NONE';

        const matchesStatus = filterStatus === 'ALL' || status === filterStatus;
        const matchesSearch = t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Đã duyệt</span>;
            case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Chờ duyệt</span>;
            case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Từ chối</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">Chưa nộp</span>;
        }
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Xét duyệt Giáo viên</h1>
                        <p className="text-gray-500">Quản lý hồ sơ và xác thực thông tin giáo viên</p>
                    </div>
                    <button
                        onClick={fetchTeachers}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <RefreshCw size={18} />
                        <span className="text-sm font-semibold">Làm mới</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 min-w-[200px]">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email..."
                            className="bg-transparent outline-none w-full text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ duyệt (Pending)</option>
                            <option value="APPROVED">Đã duyệt (Approved)</option>
                            <option value="REJECTED">Từ chối (Rejected)</option>
                            <option value="NONE">Chưa nộp (None)</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Giáo viên</th>
                                    <th className="px-6 py-3">Thông tin chuyên môn</th>
                                    <th className="px-6 py-3">Minh chứng</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                    <th className="px-6 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableSkeleton />
                                ) : filteredTeachers.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-400">Không tìm thấy giáo viên nào.</td></tr>
                                ) : (
                                    filteredTeachers.map(teacher => {
                                        const profile = teacher.teacherProfile || {};
                                        const docUrl = profile.verificationDocument;
                                        const isImg = isImage(docUrl);

                                        return (
                                            <tr key={teacher.userId} className="bg-white border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-200 overflow-hidden shrink-0">
                                                            {teacher.avatar ? (
                                                                <img src={teacher.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                teacher.fullName?.charAt(0) || 'U'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-base">{teacher.fullName}</div>
                                                            <div className="text-xs text-gray-500 font-medium">{teacher.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-gray-900 font-medium truncate max-w-[200px]" title={profile.subjects}>
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider mr-1">Môn:</span>
                                                            {profile.subjects || '-'}
                                                        </div>
                                                        <div className="text-gray-600 text-xs truncate max-w-[200px]" title={profile.qualifications}>
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider mr-1">Bằng:</span>
                                                            {profile.qualifications || '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {docUrl ? (
                                                        isImg ? (
                                                            <button
                                                                onClick={() => setPreviewImage(docUrl)}
                                                                className="group relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-gray-50"
                                                            >
                                                                <img src={docUrl} alt="Minh chứng" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition">
                                                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition duration-300">
                                                                        <Eye size={16} />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleOpenFile(docUrl)}
                                                                className="group flex flex-col items-center justify-center gap-1 w-14 h-14 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md hover:bg-blue-50 transition-all duration-300"
                                                                title="Download / Mở File"
                                                            >
                                                                <FileText size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors uppercase">FILE</span>
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(profile.verificationStatus || 'NONE')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleVerify(teacher.userId, 'APPROVED', teacher.fullName)}
                                                            disabled={profile.verificationStatus === 'APPROVED'}
                                                            className={`p-2 rounded-lg transition-all duration-200 ${profile.verificationStatus === 'APPROVED'
                                                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                                : 'bg-white text-green-600 border border-green-200 hover:bg-green-50 hover:shadow-md hover:-translate-y-0.5'
                                                                }`}
                                                            title={profile.verificationStatus === 'APPROVED' ? "Đã duyệt" : "Duyệt hồ sơ"}
                                                        >
                                                            <Check size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerify(teacher.userId, 'REJECTED', teacher.fullName)}
                                                            disabled={profile.verificationStatus === 'REJECTED'}
                                                            className={`p-2 rounded-lg transition-all duration-200 ${profile.verificationStatus === 'REJECTED'
                                                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                                : 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:shadow-md hover:-translate-y-0.5'
                                                                }`}
                                                            title={profile.verificationStatus === 'REJECTED' ? "Đã từ chối" : "Từ chối hồ sơ"}
                                                        >
                                                            <X size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {
                previewImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition z-10"
                            >
                                <X size={20} />
                            </button>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="w-full h-full object-contain max-h-[85vh]"
                            />
                            <div className="p-4 bg-white border-t flex justify-end">
                                <button
                                    onClick={() => handleOpenFile(previewImage)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                                >
                                    <FileText size={16} /> Mở trong tab mới
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${confirmModal.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {confirmModal.status === 'APPROVED' ? <Check size={24} /> : <AlertTriangle size={24} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {confirmModal.status === 'APPROVED' ? 'Duyệt giáo viên' : 'Từ chối giáo viên'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Xác nhận thao tác này cho <span className="font-semibold text-gray-900">{confirmModal.name}</span>?
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {confirmModal.status === 'APPROVED'
                                ? 'Giáo viên sẽ được cấp quyền truy cập vào hệ thống ngay lập tức.'
                                : 'Hồ sơ này sẽ bị từ chối. NẾU giáo viên đang hoạt động, quyền truy cập sẽ bị THU HỒI.'}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-4 py-2 text-white rounded-lg font-medium shadow-lg transition transform active:scale-95 ${confirmModal.status === 'APPROVED'
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-200'
                                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200'
                                    }`}
                            >
                                {confirmModal.status === 'APPROVED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout >
    );
}
