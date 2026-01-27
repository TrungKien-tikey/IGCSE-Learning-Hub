import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClassData } from './hooks/useClassData';
import { Users, GraduationCap, AlertTriangle, TrendingUp, BarChart3, ChevronRight } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4">
            <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl ${color} flex-shrink-0`}>
                <Icon size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            {subtitle && <span className="text-[10px] sm:text-xs font-medium text-slate-400 ml-2">{subtitle}</span>}
        </div>
        <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">{title}</h3>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

const StudentRow = ({ student, type }) => (
    <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 hover:bg-slate-50 rounded-lg sm:rounded-xl transition-colors border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${type === 'top' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                {student.studentName.charAt(student.studentName.length - 1)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 text-sm sm:text-base truncate">{student.studentName}</p>
                <p className="text-xs text-slate-500">{student.totalExams} bài kiểm tra</p>
            </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
            <p className="font-bold text-slate-800 text-sm sm:text-base">{student.averageScore.toFixed(1)}</p>
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${student.trend === 'UP' ? 'bg-emerald-50 text-emerald-600' : student.trend === 'DOWN' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                {student.trend === 'UP' ? '📈 TĂNG' : student.trend === 'DOWN' ? '📉 GIẢM' : '─ ỔN ĐỊNH'}
            </span>
        </div>
    </div>
);

export default function TeacherDashboard() {
    const [searchParams] = useSearchParams();
    const classId = searchParams.get('classId') || '1';
    const { data, loading, error } = useClassData(classId);

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Bảng điều khiển Giáo viên</h1>
                        <p className="text-slate-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase tracking-wider inline-block w-fit">
                                {data?.className || "Lớp học IGCSE"}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>Theo dõi hiệu suất và tiến độ học tập của cả lớp</span>
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 text-sm">
                        <AlertTriangle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Top Widgets */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    <StatCard
                        title="Tổng số học sinh"
                        value={data?.totalStudents || 0}
                        icon={Users}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Điểm trung bình lớp"
                        value={data?.classAverageScore?.toFixed(1) || "0.0"}
                        icon={GraduationCap}
                        color="bg-indigo-500"
                        subtitle="Tháng này"
                    />
                    <StatCard
                        title="Bài thi đã chấm"
                        value={data?.completedAssignments || 0}
                        icon={BarChart3}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Học sinh cần hỗ trợ"
                        value={data?.atRiskStudents?.length || 0}
                        icon={AlertTriangle}
                        color="bg-orange-500"
                        subtitle="Cảnh báo nguy cơ"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Distribution Chart (Simple CSS implementation) */}
                    <div className="lg:col-span-2 bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <BarChart3 className="text-indigo-500 w-4 h-4 sm:w-5 sm:h-5" />
                            Phân bổ điểm số của lớp
                        </h2>
                        <div className="space-y-4 sm:space-y-6">
                            {data?.scoreDistribution && Object.entries(data.scoreDistribution).map(([label, count]) => {
                                const percentage = (count / data.completedAssignments * 100) || 0;
                                let barColor = "bg-slate-200";
                                if (label.includes("Xuất sắc") || label.includes("Excellent")) barColor = "bg-gradient-to-r from-emerald-400 to-emerald-500";
                                else if (label.includes("Khá") || label.includes("Good")) barColor = "bg-gradient-to-r from-blue-400 to-blue-500";
                                else if (label.includes("Trung bình") || label.includes("Average")) barColor = "bg-gradient-to-r from-amber-400 to-amber-500";
                                else barColor = "bg-gradient-to-r from-rose-400 to-rose-500";

                                return (
                                    <div key={label} className="group">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1 sm:gap-0 mb-2">
                                            <span className="text-xs sm:text-sm font-semibold text-slate-600">{label}</span>
                                            <span className="text-xs sm:text-sm font-bold text-slate-800">{count} học sinh ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 sm:mt-10 p-3 sm:p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                            <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                                <TrendingUp className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed font-medium">
                                <span className="font-bold underline decoration-indigo-300">Nhận xét từ AI:</span> Lớp học đang có phong độ học tập <span className="font-bold text-emerald-600">{data?.classAverageScore >= 7.0 ? "rất tốt" : "ổn định"}</span>.
                                Tuy nhiên, ghi nhận có <span className="font-bold text-rose-600">{data?.atRiskStudents?.length || 0} học sinh</span> đang có dấu hiệu sụt giảm điểm số. Cần tập trung hỗ trợ nhóm này trong các bài giảng bổ trợ tuần tới.
                            </p>
                        </div>
                    </div>

                    {/* Top & At-risk lists */}
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                        {/* Top Students */}
                        <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4">⭐ Học sinh xuất sắc</h2>
                            <div className="space-y-1">
                                {data?.topStudents?.map(s => <StudentRow key={s.studentId} student={s} type="top" />)}
                            </div>
                        </div>

                        {/* At risk Students */}
                        <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-xs sm:text-sm font-bold text-orange-400 uppercase tracking-widest mb-3 sm:mb-4">⚠️ Cần quan tâm</h2>
                            <div className="space-y-1">
                                {data?.atRiskStudents?.map(s => <StudentRow key={s.studentId} student={s} type="risk" />)}
                                {(!data?.atRiskStudents || data.atRiskStudents.length === 0) && (
                                    <p className="text-center py-4 text-slate-400 text-xs sm:text-sm">Chưa có học sinh nào cần cảnh báo.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
