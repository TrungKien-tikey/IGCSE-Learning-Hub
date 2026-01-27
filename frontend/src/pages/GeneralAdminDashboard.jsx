import React, { useState, useEffect } from 'react';
import { useSystemData } from './ai/hooks/useSystemData';
import {
    Users, Shield, Activity, Clock, CheckCircle,
    Settings, FileText, ExternalLink
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import axios from 'axios';
import axiosClient from '../api/axiosClient';

// Dùng một instance axios riêng không qua interceptor auth (vì Actuator thường public hoặc basic auth)
const monitorClient = axios.create();

export default function GeneralAdminDashboard() {
    const adminName = localStorage.getItem("userName") || "Quản trị viên";
    const { data } = useSystemData();

    // State cho Health Check
    const [serviceHealth, setServiceHealth] = useState([
        { id: 'auth', name: "Auth Service", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'user', name: "User Service", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'ai', name: "AI Service", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'exam', name: "Exam Service", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'course', name: "Course Service", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
        { id: 'communication', name: "Communication Service", status: "Checking...", color: "text-gray-500", bg: "bg-gray-500" },
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // State cho tổng số người dùng
    const [totalUsers, setTotalUsers] = useState(0);

    // Hàm check health cho 1 service (với retry)
    const checkSingleService = async (svc, retries = 1) => {
        try {
            // Tăng timeout lên 5s để ổn định hơn
            const res = await monitorClient.get(`/health/${svc.id}`, { timeout: 5000 });
            if (res.data.status === 'UP') {
                return { ...svc, status: "Running", color: "text-emerald-600", bg: "bg-emerald-500" };
            } else {
                return { ...svc, status: "Down", color: "text-orange-600", bg: "bg-orange-500" };
            }
        } catch (error) {
            // Retry 1 lần nếu lần đầu fail (tránh false negative)
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Đợi 0.5s
                return checkSingleService(svc, retries - 1);
            }
            return { ...svc, status: "Stopped", color: "text-red-600", bg: "bg-red-500" };
        }
    };

    // Hàm check health (manual trigger) - Real-time update từng service
    const checkHealth = async () => {
        setIsRefreshing(true);

        // Reset tất cả về "Checking..." trước
        setServiceHealth(prev => prev.map(svc => ({
            ...svc,
            status: "Checking...",
            color: "text-gray-500",
            bg: "bg-gray-500"
        })));

        // Check từng service riêng lẻ, cập nhật UI ngay khi có kết quả
        serviceHealth.forEach(async (svc) => {
            const result = await checkSingleService(svc);
            // Cập nhật chỉ service này trong state
            setServiceHealth(prev => prev.map(s =>
                s.id === svc.id ? result : s
            ));
        });

        // Đợi tối đa 6s (timeout 5s + retry 0.5s + buffer) rồi tắt loading
        setTimeout(() => setIsRefreshing(false), 6000);
    };

    // Hàm fetch tổng số người dùng
    const fetchTotalUsers = async () => {
        try {
            // Gọi API với page=0, size=1 để chỉ lấy metadata (totalElements)
            const response = await axiosClient.get('/admin/users', {
                baseURL: '/api',
                params: {
                    page: 0,
                    size: 1
                }
            });

            if (response.data && response.data.totalElements !== undefined) {
                setTotalUsers(response.data.totalElements);
            }
        } catch (error) {
            console.error('Error fetching total users:', error);
            // Giữ giá trị mặc định nếu lỗi
        }
    };

    useEffect(() => {
        // Chỉ check 1 lần khi component mount
        checkHealth();
        fetchTotalUsers();
    }, []);

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
                    {/* <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex items-center gap-2 font-medium">
                        <Settings className="w-4 h-4" />
                        Cài đặt hệ thống
                    </button> */}
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

                {/* Main Content - Full Width Monitor */}
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
                            {/* LINK SANG GRAFANA */}
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
                    {/* Grid layout for services - more compact */}
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
