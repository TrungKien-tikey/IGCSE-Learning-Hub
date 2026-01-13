import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClassData } from './hooks/useClassData';
import { Users, GraduationCap, AlertTriangle, TrendingUp, BarChart3, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {subtitle && <span className="text-xs font-medium text-slate-400">{subtitle}</span>}
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

const StudentRow = ({ student, type }) => (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${type === 'top' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                {student.studentName.charAt(student.studentName.length - 1)}
            </div>
            <div>
                <p className="font-semibold text-slate-800">{student.studentName}</p>
                <p className="text-xs text-slate-500">{student.totalExams} bài kiểm tra</p>
            </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-slate-800">{student.averageScore.toFixed(1)}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${student.trend === 'UP' ? 'bg-emerald-50 text-emerald-600' : student.trend === 'DOWN' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Bảng điều khiển Giáo viên</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase tracking-wider">
                                {data?.className || "Lớp học IGCSE"}
                            </span>
                            • Theo dõi hiệu suất và tiến độ học tập của cả lớp
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-8 flex items-center gap-3">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                {/* Top Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Distribution Chart (Simple CSS implementation) */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart3 className="text-indigo-500" />
                            Phân bổ điểm số của lớp
                        </h2>
                        <div className="space-y-6">
                            {data?.scoreDistribution && Object.entries(data.scoreDistribution).map(([label, count]) => {
                                const percentage = (count / data.completedAssignments * 100) || 0;
                                let barColor = "bg-slate-200";
                                if (label.includes("Xuất sắc") || label.includes("Excellent")) barColor = "bg-gradient-to-r from-emerald-400 to-emerald-500";
                                else if (label.includes("Khá") || label.includes("Good")) barColor = "bg-gradient-to-r from-blue-400 to-blue-500";
                                else if (label.includes("Trung bình") || label.includes("Average")) barColor = "bg-gradient-to-r from-amber-400 to-amber-500";
                                else barColor = "bg-gradient-to-r from-rose-400 to-rose-500";

                                return (
                                    <div key={label} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-semibold text-slate-600">{label}</span>
                                            <span className="text-sm font-bold text-slate-800">{count} học sinh ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-10 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-4 items-center">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <TrendingUp className="text-indigo-600" size={20} />
                            </div>
                            <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                                <span className="font-bold underline decoration-indigo-300">Nhận xét từ AI:</span> Lớp học đang có phong độ học tập <span className="font-bold text-emerald-600">{data?.classAverageScore >= 7.0 ? "rất tốt" : "ổn định"}</span>.
                                Tuy nhiên, ghi nhận có <span className="font-bold text-rose-600">{data?.atRiskStudents?.length || 0} học sinh</span> đang có dấu hiệu sụt giảm điểm số. Cần tập trung hỗ trợ nhóm này trong các bài giảng bổ trợ tuần tới.
                            </p>
                        </div>
                    </div>

                    {/* Top & At-risk lists */}
                    <div className="space-y-8">
                        {/* Top Students */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">⭐ Học sinh xuất sắc</h2>
                            <div className="space-y-1">
                                {data?.topStudents?.map(s => <StudentRow key={s.studentId} student={s} type="top" />)}
                            </div>
                        </div>

                        {/* At risk Students */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4">⚠️ Cần quan tâm</h2>
                            <div className="space-y-1">
                                {data?.atRiskStudents?.map(s => <StudentRow key={s.studentId} student={s} type="risk" />)}
                                {(!data?.atRiskStudents || data.atRiskStudents.length === 0) && (
                                    <p className="text-center py-4 text-slate-400 text-sm">Chưa có học sinh nào cần cảnh báo.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
