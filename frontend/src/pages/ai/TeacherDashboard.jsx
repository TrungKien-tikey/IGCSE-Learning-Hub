import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Users, GraduationCap, AlertTriangle, TrendingUp, BarChart3, ChevronRight,
    FileText, CheckCircle
} from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getParticipatedExams, getExamStatistics } from '../../api/aiService';
import { getAllExams } from '../../api/examService';

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

const StudentRow = ({ student, type }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/ai/dashboard/student/${student.studentId}`)}
            className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 cursor-pointer rounded-lg sm:rounded-xl transition-colors border-b last:border-0 border-slate-100 group"
        >
            <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-transform group-hover:scale-110 ${type === 'top' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                    {student.studentName ? student.studentName.charAt(0) : 'S'}
                </div>
                <div>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors">
                        {student.studentName}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">ID: {student.studentId}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="text-right">
                    <p className={`font-bold text-xs sm:text-sm ${type === 'top' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {student.averageScore}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Điểm số</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
        </div>
    );
};

const TeacherDashboard = () => {
    const [searchParams] = useSearchParams();
    const classId = searchParams.get('classId');
    const initialExamId = searchParams.get('examId');

    // State
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState(initialExamId ? Number(initialExamId) : null);
    const [error, setError] = useState(null);

    // Fetch Exams on Mount
    useEffect(() => {
        const fetchExams = async () => {
            try {
                setLoading(true);
                const allExams = await getAllExams();
                let available = allExams;
                if (classId) {
                    try {
                        const participatedIds = await getParticipatedExams(classId);
                        available = allExams.filter(e =>
                            participatedIds.includes(e.examId) || e.examId === Number(initialExamId)
                        );
                    } catch (e) {
                        console.warn("Could not fetch participated exams", e);
                        // Fallback to all exams or just initial
                    }
                }
                setExams(available);

                if (available.length > 0) {
                    // If selectedExamId is not set (not from URL), pick the last one
                    if (!selectedExamId) {
                        setSelectedExamId(available[available.length - 1].examId);
                    }
                } else {
                    setError("Lớp này chưa có dữ liệu bài kiểm tra nào.");
                }
            } catch (err) {
                console.error(err);
                setError("Không thể tải danh sách bài kiểm tra.");
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [classId, initialExamId]); // Add initialExamId to dependency

    // Fetch Stats when Exam Selected
    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedExamId) return;
            try {
                const data = await getExamStatistics(selectedExamId, classId);
                setStats(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchStats();
    }, [selectedExamId, classId]);

    const distributionData = stats ? [
        { name: 'Yếu (<5)', value: stats.scoreDistribution['Yếu (< 5.0)'], color: '#ef4444' },
        { name: 'TB (5-7)', value: stats.scoreDistribution['Trung bình (5.0 - 6.9)'], color: '#eab308' },
        { name: 'Khá (7-8.5)', value: stats.scoreDistribution['Tốt (7.0 - 8.4)'], color: '#3b82f6' },
        { name: 'Giỏi (>8.5)', value: stats.scoreDistribution['Xuất sắc (8.5+)'], color: '#10b981' },
    ] : [];

    if (loading && exams.length === 0) {
        return (
            <MainLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </MainLayout>
        );
    }

    if (error && exams.length === 0) {
        return (
            <MainLayout>
                <div className="p-6 text-center text-red-500">
                    <AlertTriangle className="mx-auto mb-2" />
                    {error}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Thống Kê Bài Kiểm Tra</h1>
                        <p className="text-slate-500 text-sm mt-1">Phân tích kết quả theo từng bài thi cụ thể</p>
                    </div>

                    <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border shadow-sm">
                        <span className="text-sm font-medium text-slate-500 px-2">Bài thi:</span>
                        <select
                            className="bg-slate-50 border-none text-sm font-semibold text-slate-700 py-1.5 pl-2 pr-8 rounded-md focus:ring-0 outline-none cursor-pointer"
                            value={selectedExamId || ''}
                            onChange={(e) => setSelectedExamId(Number(e.target.value))}
                        >
                            {exams.map(exam => (
                                <option key={exam.examId} value={exam.examId}>
                                    {exam.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {stats ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                            <StatCard
                                title="Tổng học sinh"
                                value={stats.submittedCount}
                                icon={Users}
                                color="bg-indigo-500"
                            />
                            <StatCard
                                title="Đã nộp & chấm"
                                value={stats.gradedCount}
                                icon={CheckCircle}
                                color="bg-emerald-500"
                                subtitle="100%"
                            />
                            <StatCard
                                title="Điểm trung bình"
                                value={stats.averageScore}
                                icon={GraduationCap}
                                color="bg-blue-500"
                            />
                            <StatCard
                                title="Cần hỗ trợ"
                                value={stats.atRiskStudents?.length || 0}
                                icon={AlertTriangle}
                                color="bg-rose-500"
                            />
                        </div>

                        {/* Charts & Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Distribution Chart */}
                            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                                    Phổ điểm bài thi
                                </h3>
                                <div className="h-64 sm:h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={distributionData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {distributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Lists */}
                            <div className="space-y-6">
                                {/* Top Students */}
                                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">
                                        Xuất sắc nhất
                                    </h3>
                                    <div className="space-y-1">
                                        {stats.topStudents?.map(s => (
                                            <StudentRow key={s.studentId} student={s} type="top" />
                                        ))}
                                        {(!stats.topStudents || stats.topStudents.length === 0) && (
                                            <p className="text-slate-400 text-sm text-center py-4">Chưa có dữ liệu</p>
                                        )}
                                    </div>
                                </div>

                                {/* At Risk */}
                                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 text-rose-500">
                                        Cần lưu ý
                                    </h3>
                                    <div className="space-y-1">
                                        {stats.atRiskStudents?.map(s => (
                                            <StudentRow key={s.studentId} student={s} type="risk" />
                                        ))}
                                        {(!stats.atRiskStudents || stats.atRiskStudents.length === 0) && (
                                            <p className="text-slate-400 text-sm text-center py-4">Không có học sinh nào</p>
                                        )}
                                    </div>
                                    {stats.atRiskStudents?.length > 0 && (
                                        <button className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                                            Gửi nhắc nhở
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-slate-600 font-medium">Chưa chọn bài kiểm tra nào</h3>
                        <p className="text-slate-400 text-sm mt-1">Vui lòng chọn một bài thi để xem thống kê chi tiết</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default TeacherDashboard;
