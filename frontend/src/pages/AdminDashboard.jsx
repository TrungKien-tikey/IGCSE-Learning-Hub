import React, { useState, useEffect } from 'react';
import { Users, Trash2, UserX, Search, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch('http://localhost:8083/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
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
            const res = await fetch(`http://localhost:8083/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                alert('Xóa người dùng thành công!');
                fetchUsers();
            } else {
                alert('Lỗi khi xóa người dùng!');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Không thể kết nối đến server.');
        }
    };

    const handleDeactivate = async (userId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`http://localhost:8083/api/admin/users/${userId}/deactivate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                alert('Vô hiệu hóa người dùng thành công!');
                fetchUsers();
            } else {
                alert('Lỗi khi vô hiệu hóa người dùng!');
            }
        } catch (error) {
            console.error('Error deactivating user:', error);
            alert('Không thể kết nối đến server.');
        }
    };

    const handleActivate = async (userId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`http://localhost:8083/api/admin/users/${userId}/activate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                alert('Kích hoạt người dùng thành công!');
                fetchUsers();
            } else {
                alert('Lỗi khi kích hoạt người dùng!');
            }
        } catch (error) {
            console.error('Error activating user:', error);
            alert('Không thể kết nối đến server.');
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        Admin Dashboard - Quản lý Người dùng
                    </h1>
                    <p className="text-gray-500 mt-2">Quản lý toàn bộ người dùng trong hệ thống</p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Không tìm thấy người dùng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                {user.isActive ? (
                                                    <button
                                                        onClick={() => handleDeactivate(user.userId)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        Vô hiệu hóa
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(user.userId)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        Kích hoạt
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(user.userId)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Tổng số người dùng</p>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Đã vô hiệu hóa</p>
                        <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
