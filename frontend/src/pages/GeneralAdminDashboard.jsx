import React, { useState, useEffect } from 'react';
import { useSystemData } from './ai/hooks/useSystemData';
import {
    Users, Shield, Activity, Clock, CheckCircle,
    Settings, FileText, ExternalLink, DollarSign, TrendingUp,
    CreditCard, Package, ChevronDown, Calendar, Award,
    ArrowUpRight, ArrowDownRight, BarChart2, PieChart, Check
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import axios from 'axios';
import axiosClient from '../api/axiosClient';
import userClient from '../api/userClient';
import {
    getRevenueOverview,
    getMonthlyRevenue,
    getTransactionHistory,
    getTopTeachers,
    getSlotStatistics,
    confirmSlotPayment,
    confirmCoursePayment
} from '../api/paymentService';
import { toast } from 'react-toastify';

// Monitor client with Ngrok URL for health checks
const NGROK_BASE_URL = import.meta.env.VITE_MAIN_API_URL?.replace('/api', '') || '';
const monitorClient = axios.create({
    baseURL: NGROK_BASE_URL,
    headers: {
        'ngrok-skip-browser-warning': '69420',
    },
});

// Hàm format tiền VNĐ
const formatCurrency = (value) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

// Component hiển thị biểu đồ cột đơn giản
const SimpleBarChart = ({ data, maxValue }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="flex items-end gap-1 h-32">
            {data.map((item, index) => {
                const height = maxValue > 0 ? (item.totalRevenue / maxValue) * 100 : 0;
                return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm transition-all duration-500 hover:from-indigo-600 hover:to-indigo-500"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${item.monthName}: ${formatCurrency(item.totalRevenue)}`}
                        />
                        <span className="text-[10px] text-slate-400 mt-1">{item.month}</span>
                    </div>
                );
            })}
        </div>
    );
};

// Component hiển thị transaction status badge
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoàn thành' },
        'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Đang chờ' },
        'FAILED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Thất bại' },
        'REFUNDED': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Hoàn tiền' }
    };
    const config = statusConfig[status] || statusConfig['PENDING'];

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

// Component hiển thị transaction type badge
const TypeBadge = ({ type }) => {
    const typeConfig = {
        'SLOT_PURCHASE': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Mua suất học' },
        'COURSE_ENROLLMENT': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Mua khóa học' }
    };
    const config = typeConfig[type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: type };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

export default function GeneralAdminDashboard() {
    const adminName = localStorage.getItem("userName") || "Quản trị viên";
    const { data } = useSystemData();

    // States cho Health Check
    const [serviceHealth, setServiceHealth] = useState([
        { id: 'auth', name: "Auth Service", path: "/api/auth/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'user', name: "User Service", path: "/api/users/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'ai', name: "AI Service", path: "/api/ai/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'exam', name: "Exam Service", path: "/api/exams/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'course', name: "Course Service", path: "/api/courses/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'communication', name: "Communication Service", path: "/api/notifications/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'payment', name: "Payment Service", path: "/api/payment/health", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);

    // States cho Payment Statistics
    const [revenueOverview, setRevenueOverview] = useState(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [topTeachers, setTopTeachers] = useState([]);
    const [slotStats, setSlotStats] = useState(null);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, teachers
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, PENDING, FAILED, REFUNDED
    const [itemsPerPage] = useState(10);

    // Hàm check health cho 1 service
    const checkSingleService = async (svc, retries = 1) => {
        try {
            const res = await monitorClient.get(svc.path, { timeout: 5000 });
            if (res.data.status === 'UP') {
                return { ...svc, status: "Running", color: "text-emerald-600", bg: "bg-emerald-500" };
            } else {
                return { ...svc, status: "Down", color: "text-orange-600", bg: "bg-orange-500" };
            }
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                return checkSingleService(svc, retries - 1);
            }
            return { ...svc, status: "Stopped", color: "text-red-600", bg: "bg-red-500" };
        }
    };

    // Hàm check health
    const checkHealth = async () => {
        setIsRefreshing(true);
        setServiceHealth(prev => prev.map(svc => ({
            ...svc, status: "Checking...", color: "text-gray-500", bg: "bg-gray-500"
        })));

        serviceHealth.forEach(async (svc) => {
            const result = await checkSingleService(svc);
            setServiceHealth(prev => prev.map(s => s.id === svc.id ? result : s));
        });

        setTimeout(() => setIsRefreshing(false), 6000);
    };

    // Hàm fetch tổng số người dùng
    const fetchTotalUsers = async () => {
        try {
            const response = await axiosClient.get('/api/admin/users', {
                params: { page: 0, size: 1 }
            });
            if (response.data?.totalElements !== undefined) {
                setTotalUsers(response.data.totalElements);
            }
        } catch (error) {
            console.error('Error fetching total users:', error);
        }
    };

    // Hàm fetch Payment Statistics
    const fetchPaymentData = async () => {
        setIsLoadingPayment(true);
        try {
            const [overview, monthly, trans, teachers, slots] = await Promise.allSettled([
                getRevenueOverview(),
                getMonthlyRevenue(),
                getTransactionHistory({ page: 0, size: 10 }),
                getTopTeachers(5),
                getSlotStatistics()
            ]);

            if (overview.status === 'fulfilled') setRevenueOverview(overview.value);
            if (monthly.status === 'fulfilled') setMonthlyRevenue(monthly.value);
            if (trans.status === 'fulfilled') setTransactions(trans.value?.content || []);
            if (teachers.status === 'fulfilled') setTopTeachers(teachers.value);
            if (slots.status === 'fulfilled') setSlotStats(slots.value);
        } catch (error) {
            console.error('Error fetching payment data:', error);
        } finally {
            setIsLoadingPayment(false);
        }
    };

    const handleConfirm = async (transaction) => {
        if (!window.confirm(`Xác nhận thanh toán ${formatCurrency(transaction.amount)} từ ${transaction.buyerName}?`)) {
            return;
        }

        try {
            let result;
            if (transaction.transactionType === 'SLOT_PURCHASE') {
                result = await confirmSlotPayment(transaction.referenceId);
            } else if (transaction.transactionType === 'COURSE_ENROLLMENT') {
                result = await confirmCoursePayment(transaction.referenceId);
            }

            if (result && result.success) {
                toast.success(result.message);
                fetchPaymentData(); // Refresh data
            } else {
                toast.error("Xác nhận thất bại!");
            }
        } catch (error) {
            console.error('Confirm error:', error);
            toast.error(error.response?.data?.message || "Lỗi xác nhận giao dịch");
        }
    };

    useEffect(() => {
        checkHealth();
        fetchTotalUsers();
        fetchPaymentData();
    }, []);

    // Stats cards data
    const stats = [
        {
            title: "Tổng bài đã chấm",
            value: data?.totalGraded?.toLocaleString() || "0",
            icon: CheckCircle,
            color: "text-indigo-600",
            bg: "bg-indigo-100"
        },
        {
            title: "Độ chính xác AI",
            value: `${data?.averageAccuracy?.toFixed(1) || "0.0"}%`,
            icon: Shield,
            color: "text-emerald-600",
            bg: "bg-emerald-100"
        },
        {
            title: "Thời gian tiết kiệm",
            value: `${data?.hoursSaved?.toFixed(0) || 0} giờ`,
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            title: "Tổng người dùng",
            value: totalUsers > 0 ? totalUsers.toLocaleString('vi-VN') : "0",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
    ];

    // Revenue stats cards
    const revenueStats = revenueOverview ? [
        {
            title: "Tổng doanh thu",
            value: formatCurrency(revenueOverview.totalRevenue),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
            trend: "+12%"
        },
        {
            title: "Doanh thu Admin",
            value: formatCurrency(revenueOverview.totalPlatformRevenue),
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-100",
            trend: "+8%"
        },
        {
            title: "Giao dịch hoàn thành",
            value: revenueOverview.completedTransactions?.toLocaleString() || "0",
            icon: CreditCard,
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Suất học đã bán",
            value: slotStats?.totalSlotsSold?.toLocaleString() || "0",
            icon: Package,
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
    ] : [];

    const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(m => m.totalRevenue || 0), 1);

    return (
        <MainLayout>
            <div className="space-y-8 p-4">
                {/* Admin Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-indigo-600" />
                            Hệ thống Quản trị
                        </h1>
                        <p className="text-slate-500 mt-1">Xin chào, {adminName}. Toàn bộ hệ thống đang hoạt động ổn định.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                            </div>
                            <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
                        </div>
                    ))}
                </div>

                {/* ==================== PAYMENT STATISTICS SECTION ==================== */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Thống kê Doanh thu
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchPaymentData}
                                disabled={isLoadingPayment}
                                className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                                {isLoadingPayment ? "Đang tải..." : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {/* Revenue Overview Cards */}
                    {revenueOverview && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100">
                            {revenueStats.map((stat, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        </div>
                                        {stat.trend && (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                                <ArrowUpRight className="w-3 h-3" />
                                                {stat.trend}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                                    <p className="text-xs text-slate-500">{stat.title}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        {[
                            { id: 'overview', label: 'Tổng quan', icon: BarChart2 },
                            { id: 'transactions', label: 'Giao dịch', icon: CreditCard },
                            { id: 'teachers', label: 'Top Giáo viên', icon: Award }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {/* Overview Tab - Monthly Revenue Chart */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-700">Doanh thu theo tháng ({new Date().getFullYear()})</h3>
                                </div>
                                {monthlyRevenue.length > 0 ? (
                                    <SimpleBarChart data={monthlyRevenue} maxValue={maxMonthlyRevenue} />
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-slate-400">
                                        {isLoadingPayment ? "Đang tải dữ liệu..." : "Chưa có dữ liệu doanh thu"}
                                    </div>
                                )}

                                {/* Revenue breakdown */}
                                {revenueOverview && (
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="bg-purple-50 p-4 rounded-xl">
                                            <p className="text-xs text-purple-600 font-medium mb-1">Doanh thu từ suất học</p>
                                            <p className="text-lg font-bold text-purple-800">
                                                {formatCurrency(revenueOverview.slotPurchaseRevenue)}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl">
                                            <p className="text-xs text-blue-600 font-medium mb-1">Doanh thu từ khóa học</p>
                                            <p className="text-lg font-bold text-blue-800">
                                                {formatCurrency(revenueOverview.courseEnrollmentRevenue)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && (
                            <div className="space-y-4">
                                {/* Filter Status */}
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Lọc:</span>
                                    <div className="flex gap-2">
                                        {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                    statusFilter === status
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {status === 'ALL' ? 'Tất cả' :
                                                 status === 'COMPLETED' ? 'Hoàn thành' :
                                                 status === 'PENDING' ? 'Đang chờ' :
                                                 status === 'FAILED' ? 'Thất bại' : 'Hoàn tiền'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                <div className="overflow-x-auto">
                                    {transactions.length > 0 ? (
                                        <>
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                                                        <th className="pb-3 font-medium">ID</th>
                                                        <th className="pb-3 font-medium">Loại</th>
                                                        <th className="pb-3 font-medium">Người mua</th>
                                                        <th className="pb-3 font-medium">Số tiền</th>
                                                        <th className="pb-3 font-medium">Trạng thái</th>
                                                        <th className="pb-3 font-medium">Hành động</th>
                                                        <th className="pb-3 font-medium">Ngày</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {transactions
                                                        .filter(trans => statusFilter === 'ALL' || trans.paymentStatus === statusFilter)
                                                        .slice(0, itemsPerPage)
                                                        .map((trans, idx) => (
                                                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                                <td className="py-3 font-mono text-xs text-slate-400">#{trans.id}</td>
                                                                <td className="py-3"><TypeBadge type={trans.transactionType} /></td>
                                                                <td className="py-3">
                                                                    <div>
                                                                        <p className="font-medium text-slate-700">{trans.buyerName || 'N/A'}</p>
                                                                        <p className="text-xs text-slate-400">{trans.buyerRole}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 font-semibold text-slate-800">{formatCurrency(trans.amount)}</td>
                                                                <td className="py-3"><StatusBadge status={trans.paymentStatus} /></td>
                                                                <td className="py-3">
                                                                    {trans.paymentStatus === 'PENDING' && (
                                                                        <button
                                                                            onClick={() => handleConfirm(trans)}
                                                                            className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"
                                                                            title="Xác nhận thanh toán"
                                                                        >
                                                                            <Check size={16} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-slate-500 text-xs">
                                                                    {trans.transactionDate ? new Date(trans.transactionDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                            {/* Summary */}
                                            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex justify-between">
                                                <span>
                                                    Hiển thị {Math.min(itemsPerPage, transactions.filter(t => statusFilter === 'ALL' || t.paymentStatus === statusFilter).length)} / {transactions.filter(t => statusFilter === 'ALL' || t.paymentStatus === statusFilter).length} giao dịch
                                                </span>
                                                <span className="font-semibold">
                                                    Tổng: {formatCurrency(
                                                        transactions
                                                            .filter(t => statusFilter === 'ALL' || t.paymentStatus === statusFilter)
                                                            .slice(0, itemsPerPage)
                                                            .reduce((sum, t) => sum + (t.amount || 0), 0)
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-slate-400">
                                            {isLoadingPayment ? "Đang tải dữ liệu..." : "Chưa có giao dịch nào"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Top Teachers Tab */}
                        {activeTab === 'teachers' && (
                            <div className="space-y-3">
                                {topTeachers.length > 0 ? (
                                    topTeachers.map((teacher, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                                                        idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                                                            'bg-slate-300'
                                                    }`}>
                                                    {teacher.rank || idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{teacher.teacherName}</p>
                                                    <p className="text-xs text-slate-500">ID: {teacher.teacherId}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600">{formatCurrency(teacher.totalRevenue)}</p>
                                                <p className="text-xs text-slate-400">Doanh thu</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-slate-400">
                                        {isLoadingPayment ? "Đang tải dữ liệu..." : "Chưa có dữ liệu giáo viên"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Monitor các Service */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            Monitor các Service
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={checkHealth}
                                disabled={isRefreshing}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRefreshing ? "Đang tải..." : "Refresh"}
                            </button>
                            <a
                                href="http://localhost:3001"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1 transition-colors"
                            >
                                <ExternalLink size={12} /> Grafana
                            </a>
                        </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {serviceHealth.map((svc, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${svc.bg}`}></div>
                                    <span className="font-medium text-slate-700">{svc.name}</span>
                                </div>
                                <div className="flex gap-4 text-sm items-center">
                                    <span className="text-slate-400 text-xs hidden sm:block">Region: Local</span>
                                    <span className={`font-mono font-bold text-xs ${svc.color}`}>
                                        [{svc.status.toUpperCase()}]
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
