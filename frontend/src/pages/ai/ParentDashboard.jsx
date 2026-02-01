import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import {
    getLearningAnalytics,
    getParentSummary
} from '../../api/aiService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import {
    AlertTriangle, TrendingUp, BookOpen, Clock, Activity,
    CheckCircle, XCircle, Brain
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function ParentDashboard() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) {
            // Placeholder logic: If no ID, maybe redirect or show error.
            // For demo, we assume ID is passed.
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryRes, analyticsRes] = await Promise.all([
                    getParentSummary(studentId),
                    getLearningAnalytics(studentId)
                ]);
                setSummary(summaryRes);
                setAnalytics(analyticsRes);
            } catch (err) {
                console.error("Error fetching parent data:", err);
                // Fallback demo data if API fails (for testing UI without backend ready)
                // or just toast error.
                toast.error("Không thể tải dữ liệu phụ huynh: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </MainLayout>
        );
    }

    if (!summary || !analytics) {
        return (
            <MainLayout>
                <div className="p-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu cho học sinh này.
                </div>
            </MainLayout>
        );
    }

    // --- Helpers for UI ---
    const getStatusColor = (status) => {
        if (status === 'Xuất sắc') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (status === 'Tốt') return 'text-blue-600 bg-blue-50 border-blue-200';
        if (status === 'Cần cố gắng') return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    const formatEffortData = (efforts) => {
        // Transform efforts for Scatter Chart
        // x: attemptIndex/Time, y: score, z: duration
        return efforts.map((e, idx) => ({
            name: `Exam ${e.attemptId}`,
            score: e.score,
            duration: Math.round(e.durationSeconds / 60), // minutes
            index: idx + 1
        }));
    };

    const effortData = formatEffortData(analytics.effortMetrics || []);

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">

                {/* HEADER */}
                <header>
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        Tổng quan học tập của <span className="text-indigo-600">{summary.studentName || "Học sinh"}</span>
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Theo dõi sát sao tiến độ và hiệu quả học tập thông qua AI Analytics.
                    </p>
                </header>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Academic Status */}
                    <div className={`p-6 rounded-2xl border flex flex-col items-center text-center ${getStatusColor(summary.academicStatus)}`}>
                        <Activity className="w-12 h-12 mb-3 opacity-80" />
                        <h3 className="text-slate-600 font-medium uppercase text-xs tracking-wider">Đánh giá tổng quan</h3>
                        <p className="text-3xl font-bold mt-1">{summary.academicStatus}</p>
                        <span className="mt-2 text-sm font-semibold px-3 py-1 rounded-full bg-white/50">
                            {summary.trendSummary}
                        </span>
                    </div>

                    {/* Card 2: Effort Score */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center text-center">
                        <Clock className="w-12 h-12 mb-3 text-indigo-500" />
                        <h3 className="text-slate-500 font-medium uppercase text-xs tracking-wider">Điểm chuyên cần & Nỗ lực</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{summary.overallEffortScore}/10</p>
                        <p className="text-xs text-slate-400 mt-2">Dựa trên thời gian làm bài thực tế</p>
                    </div>

                    {/* Card 3: Newest Insight/Weakness */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col text-left">
                        <div className="flex items-center gap-2 mb-3 text-rose-500">
                            <AlertTriangle size={20} />
                            <h3 className="font-bold uppercase text-xs tracking-wider">Cần cải thiện</h3>
                        </div>
                        <ul className="space-y-2">
                            {summary.topWeaknesses.length > 0 ? (
                                summary.topWeaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                        {w}
                                    </li>
                                ))
                            ) : (
                                <li className="text-emerald-600 text-sm italic">Chưa phát hiện điểm yếu lớn nào.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* ALERTS SECTION (Conditional) */}
                {summary.recentAlerts && summary.recentAlerts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5" />
                            Cảnh báo cần lưu ý
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {summary.recentAlerts.map((alert, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                                    <p className="text-slate-700 font-medium text-sm">{alert}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Chart 1: Learning Curve */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    Biểu đồ phong độ (Learning Curve)
                                </h3>
                                <p className="text-xs text-slate-400">Điểm số qua các bài thi</p>
                            </div>
                        </div>
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.learningCurve}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')} />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        name="Điểm số"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Effort vs Efficiency */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-emerald-600" />
                                    Nỗ lực & Hiệu quả (Effort vs Score)
                                </h3>
                                <p className="text-xs text-slate-400">Điểm số so với thời gian làm bài (phút)</p>
                            </div>
                        </div>
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="duration" name="Thời gian" unit=" phút" domain={[0, 'auto']} />
                                    <YAxis type="number" dataKey="score" name="Điểm" unit="" domain={[0, 10]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Legend />
                                    {/* Safe Zone */}
                                    <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="3 3" />
                                    <ReferenceLine x={5} stroke="#cbd5e1" label="Rushed" />

                                    <Scatter name="Bài thi" data={effortData} fill="#10b981">
                                        {effortData.map((entry, index) => (
                                            <cell key={`cell-${index}`} fill={entry.score >= 8 ? '#10b981' : (entry.score < 5 ? '#f43f5e' : '#f59e0b')} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                            <div className="mt-2 text-center text-xs text-slate-400">
                                * Chấm xanh: Tốt | Vàng: Trung bình | Đỏ: Yếu/Cảnh báo
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}
