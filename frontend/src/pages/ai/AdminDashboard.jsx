import React from 'react';
import { useSystemData } from './hooks/useSystemData';
import { Shield, Activity, Cpu, Clock, Server, CheckCircle, Database } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';

const AdminStatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 -mr-6 sm:-mr-8 -mt-6 sm:-mt-8 opacity-5 rounded-full ${color}`} />
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
            <div className={`p-1.5 sm:p-2 rounded-lg ${color} bg-opacity-10 flex-shrink-0`}>
                <Icon size={16} className={`sm:w-4 sm:h-4 md:w-5 md:h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">{title}</h3>
        </div>
        <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{value}</p>
            {trend && (
                <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                </span>
            )}
        </div>
    </div>
);

export default function AdminStatistics() {
    const { data, loading, error } = useSystemData();

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Hệ thống Quản trị AI</h1>
                        <p className="text-slate-500 mt-1 text-sm">Giám sát tài nguyên, hiệu suất và độ chính xác của mô hình</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex-shrink-0">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Hệ thống đang hoạt động</span>
                    </div>
                </header>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    <AdminStatCard
                        title="Tổng bài đã chấm"
                        value={data?.totalGraded?.toLocaleString() || 0}
                        icon={CheckCircle}
                        color="bg-indigo-600"
                        trend="up"
                        trendValue="12%"
                    />
                    <AdminStatCard
                        title="Độ chính xác AI"
                        value={`${data?.averageAccuracy?.toFixed(1) || "0.0"}%`}
                        icon={Shield}
                        color="bg-emerald-600"
                    />
                    <AdminStatCard
                        title="Thời gian tiết kiệm"
                        value={`${data?.hoursSaved?.toFixed(0) || 0} giờ`}
                        icon={Clock}
                        color="bg-orange-600"
                    />
                    <AdminStatCard
                        title="Trạng thái"
                        value="Hoạt động tốt"
                        icon={Activity}
                        color="bg-blue-600"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* System Resources */}
                    <div className="lg:col-span-2 bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 md:mb-8 flex items-center gap-2">
                            <Server className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-sm sm:text-base md:text-xl">Tài nguyên & Trạng thái dịch vụ</span>
                        </h2>

                        <div className="space-y-4 sm:space-y-6 md:space-y-8">
                            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                <div className="p-4 sm:p-5 md:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            <Cpu className="text-indigo-500 w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
                                            <span className="font-bold text-slate-700 text-xs sm:text-sm truncate">Bộ máy chấm điểm AI</span>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded uppercase font-mono tracking-tighter flex-shrink-0">Trực tuyến</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[65%] shadow-sm" />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-2 font-medium italic">Tải: 65% • Độ trễ: 240ms</p>
                                </div>

                                <div className="p-4 sm:p-5 md:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            <Database className="text-blue-500 w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
                                            <span className="font-bold text-slate-700 text-xs sm:text-sm truncate">Cơ sở dữ liệu Phân tích</span>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded uppercase font-mono tracking-tighter flex-shrink-0">Trực tuyến</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[42%] shadow-sm" />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-2 font-medium italic">Sử dụng: 42% • 1.2M Bản ghi</p>
                                </div>
                            </div>

                            <div className="pt-4 sm:pt-6 border-t border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Nhật ký hệ thống gần đây</h3>
                                <div className="space-y-2 sm:space-y-3 font-mono text-[10px] sm:text-[11px] bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                                    <div className="flex gap-4 text-emerald-600">
                                        <span className="opacity-50">[23:58:12]</span>
                                        <span className="font-bold">INFO: Hoàn tất nạp dữ liệu từ NiFi (4 bản ghi)</span>
                                    </div>
                                    <div className="flex gap-4 text-indigo-600">
                                        <span className="opacity-50">[23:55:04]</span>
                                        <span className="font-bold">DEBUG: Tính toán lại độ chính xác hệ thống: 94.2%</span>
                                    </div>
                                    <div className="flex gap-4 text-slate-500 italic">
                                        <span className="opacity-50">[23:50:00]</span>
                                        <span>Kiểm tra sức khỏe hệ thống: Tất cả dịch vụ bình thường</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Model Summary */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6">Mô hình AI hiện tại</h2>
                            <div className="bg-white bg-opacity-10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white border-opacity-10 mb-4 sm:mb-6">
                                <p className="text-xs text-indigo-200 mb-1">Provider</p>
                                <p className="font-bold text-sm sm:text-base">LangChain4j / OpenAI GPT-4o</p>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-indigo-200">Ngưỡng tin cậy</span>
                                    <span className="font-mono bg-white bg-opacity-20 px-2 rounded">0.85</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-indigo-200">Hỗ trợ ngôn ngữ</span>
                                    <span className="font-medium">EN, VI, FR</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-indigo-200">Phiên bản Prompt</span>
                                    <span className="font-mono text-indigo-300">v2.4.1</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-12 pt-4 sm:pt-8 border-t border-white border-opacity-10">
                            <p className="text-xs text-indigo-300 italic">
                                "Hệ thống đang chạy trên cơ sở dữ liệu phân tán, tự động đồng bộ qua NiFi ETL Pipeline."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
