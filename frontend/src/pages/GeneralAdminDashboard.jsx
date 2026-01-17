import { useSystemData } from './ai/hooks/useSystemData';
import {
    Users, Shield, Server, Activity, Clock, CheckCircle,
    Settings, Database, AlertCircle, FileText, MessageSquare
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function GeneralAdminDashboard() {
    const adminName = localStorage.getItem("userName") || "Quản trị viên";
    const { data } = useSystemData();

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
            value: "1,240",
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
                    <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex items-center gap-2 font-medium">
                        <Settings className="w-4 h-4" />
                        Cài đặt hệ thống
                    </button>
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

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* System Monitor */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                Monitor các Service
                            </h2>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">HEALTHY</span>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { name: "Auth Service", status: "Running", uptime: "15 days", cpu: "2.4%" },
                                { name: "Exam Service", status: "Running", uptime: "15 days", cpu: "5.1%" },
                                { name: "AI Service", status: "Running", uptime: "3 days", cpu: "12.8%" },
                                { name: "User Service", status: "Running", uptime: "15 days", cpu: "1.1%" },
                            ].map((svc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="font-medium text-slate-700">{svc.name}</span>
                                    </div>
                                    <div className="flex gap-8 text-sm">
                                        <span className="text-slate-400">Uptime: {svc.uptime}</span>
                                        <span className="text-slate-600 font-mono">CPU: {svc.cpu}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Logs */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Log hệ thống gần đây
                        </h2>
                        <div className="space-y-4">
                            <div className="text-xs space-y-1">
                                <p className="text-slate-400">19:15:32 - INFO</p>
                                <p className="text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">New user registered: user_1293</p>
                            </div>
                            <div className="text-xs space-y-1">
                                <p className="text-slate-400">19:10:05 - WARN</p>
                                <p className="text-slate-700 font-medium">AI Service high memory usage detected</p>
                            </div>
                            <div className="text-xs space-y-1">
                                <p className="text-slate-400">18:45:12 - ERROR</p>
                                <p className="text-slate-700 font-medium text-red-600">Failed to connect to Mail Server</p>
                            </div>
                        </div>
                        <button className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
                            Xem nhật ký chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

