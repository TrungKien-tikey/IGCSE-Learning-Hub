import React, { useState, useEffect } from 'react';
import { Users, Trash2, UserX, Search, RefreshCw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import MainLayout from '../layouts/MainLayout';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Gọi qua axiosClient để tận dụng Interceptor (Token) và Proxy
            // Override baseURL về /api vì Controller là /api/admin/users (không có v1)
            const res = await axiosClient.get('/admin/users', {
                baseURL: '/api'
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            // alert('Không thể tải danh sách người dùng.'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

        const token = localStorage.getItem('accessToken');
        try {
            await axiosClient.delete(`/admin/users/${userId}`, {
                baseURL: '/api'
            });
            alert('Xóa người dùng thành công!');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Lỗi khi xóa người dùng!');
        }
    };

    const handleDeactivate = async (userId) => {
        const token = localStorage.getItem('accessToken');
        try {
            await axiosClient.patch(`/admin/users/${userId}/deactivate`, {}, {
                baseURL: '/api'
            });
            alert('Vô hiệu hóa người dùng thành công!');
            fetchUsers();
        } catch (error) {
            console.error('Error deactivating user:', error);
            alert('Lỗi khi vô hiệu hóa người dùng!');
        }
    };

    const handleActivate = async (userId) => {
        const token = localStorage.getItem('accessToken');
        try {
            await axiosClient.patch(`/admin/users/${userId}/activate`, {}, {
                baseURL: '/api'
            });
            alert('Kích hoạt người dùng thành công!');
            fetchUsers();
        } catch (error) {
            console.error('Error activating user:', error);
            alert('Lỗi khi kích hoạt người dùng!');
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        const token = localStorage.getItem('accessToken');
        try {
            await axiosClient.patch(`/admin/users/${userId}/role`, { role: newRole }, {
                baseURL: '/api'
            });
            alert('Cập nhật quyền thành công!');
            fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Lỗi khi cập nhật quyền!');
        }
    };

    const [filterRole, setFilterRole] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const displayedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Skeleton Row Component
    const SkeletonRow = () => (
        <tr className="animate-pulse border-b border-gray-200">
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
            <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24"></div></td>
            <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
            <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-28"></div></td>
        </tr>
    );

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1">Quản lý toàn bộ người dùng trong hệ thống</p>
                    </div>
                </div>

                {/* 1. MOVED STATS TO TOP */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Tổng người dùng</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Đang hoạt động</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{users.filter(u => u.isActive).length}</p>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <RefreshCw size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-500 font-medium uppercase">Đã khóa / Vô hiệu</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{users.filter(u => !u.isActive).length}</p>
                            </div>
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                <UserX size={24} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar & Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset page on search
                                }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={filterRole}
                            onChange={(e) => {
                                setFilterRole(e.target.value);
                                setCurrentPage(1); // Reset page on filter
                            }}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium text-gray-700"
                        >
                            <option value="ALL">Tất cả vai trò</option>
                            <option value="STUDENT">Học sinh (Student)</option>
                            <option value="TEACHER">Giáo viên (Teacher)</option>
                            <option value="PARENT">Phụ huynh (Parent)</option>
                            <option value="ADMIN">Quản trị viên (Admin)</option>
                        </select>

                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ và tên</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : displayedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <UserX className="w-12 h-12 text-gray-300 mb-2" />
                                                <p>Không tìm thấy người dùng nào phù hợp</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayedUsers.map((user) => (
                                        <tr key={user.userId} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{user.userId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                        {user.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user.userId, e.target.value)}
                                                    className="block w-full pl-3 pr-8 py-1.5 text-xs font-semibold border-gray-200 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="STUDENT">STUDENT</option>
                                                    <option value="TEACHER">TEACHER</option>
                                                    <option value="MANAGER">MANAGER</option>
                                                    <option value="PARENT">PARENT</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    {user.isActive ? (
                                                        <button
                                                            onClick={() => handleDeactivate(user.userId)}
                                                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                                                            title="Vô hiệu hóa"
                                                        >
                                                            <UserX className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleActivate(user.userId)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                            title="Kích hoạt"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(user.userId)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Xóa người dùng"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                            <p className="text-sm text-gray-500">
                                Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> trong tổng số <span className="font-medium">{filteredUsers.length}</span> kết quả
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 text-sm border rounded-md ${currentPage === page
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
