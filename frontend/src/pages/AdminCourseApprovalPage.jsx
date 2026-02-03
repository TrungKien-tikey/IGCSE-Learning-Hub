import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import {
  Eye, CheckCircle, ShieldCheck, Clock,
  Archive, BookOpen, AlertCircle
} from 'lucide-react';

export default function AdminCourseApprovalPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' hoặc 'published'
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/courses/admin/all');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Không thể kết nối dữ liệu Server");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  // Phân loại dữ liệu
  const pendingCourses = courses.filter(c => c && !c.active);
  const publishedCourses = courses.filter(c => c && c.active);
  const displayCourses = activeTab === 'pending' ? pendingCourses : publishedCourses;

  // Hàm Phê duyệt (Dùng PUT /activate)
  const handleApprove = async (id) => {
    if (!window.confirm("Xác nhận xuất bản khóa học này?")) return;
    try {
      await axiosClient.put(`/api/courses/${id}/activate`);
      toast.success("Đã phê duyệt thành công!");
      fetchCourses();
    } catch (err) { toast.error("Lỗi khi phê duyệt"); }
  };

  // Hàm Ẩn lại (Dùng DELETE /deactivate)
  const handleDeactivate = async (id) => {
    if (!window.confirm("Bạn có chắc muốn ẩn khóa học này? Học sinh sẽ không thấy nó nữa.")) return;
    try {
      await axiosClient.delete(`/api/courses/${id}/deactivate`);
      toast.warning("Đã ẩn khóa học!");
      fetchCourses();
    } catch (err) { toast.error("Lỗi khi ẩn khóa học"); }
  };

  if (loading) return <MainLayout><div className="p-10 text-center">Đang tải...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="p-8 bg-slate-50 min-h-screen">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} />
            Quản Lý Vòng Đời Khóa Học
          </h1>
        </header>

        {/* Hệ thống Tabs */}
        <div className="flex gap-8 border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'pending' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Clock size={18} /> Chờ xét duyệt ({pendingCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'published' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <CheckCircle size={18} /> Đã xuất bản ({publishedCourses.length})
          </button>
        </div>

        {/* Danh sách khóa học */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCourses.length > 0 ? displayCourses.map(course => (
            <div key={course.courseId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${activeTab === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {activeTab === 'pending' ? 'Pending' : 'Live'}
                  </span>
                  <p className="font-bold text-slate-800">${course.price}</p>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">{course.title}</h3>
                <p className="text-slate-500 text-xs line-clamp-2 mb-4 h-8">{course.description}</p>
                <p className="text-[10px] text-slate-400">Giáo viên ID: {course.teacherId}</p>
              </div>

              <div className="p-4 bg-slate-50 border-t flex gap-2">
                <button
                  onClick={() => navigate(`/learning/${course.courseId}`)}
                  className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all"
                >
                  <Eye size={16} /> Xem
                </button>

                {activeTab === 'pending' ? (
                  <button
                    onClick={() => handleApprove(course.courseId)}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all"
                  >
                    Duyệt
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeactivate(course.courseId)}
                    className="flex-1 bg-white border border-rose-200 text-rose-600 py-2 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-all"
                  >
                    Ẩn khóa học
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 flex flex-col items-center text-slate-400">
              <Archive size={48} className="mb-4 opacity-20" />
              <p>Trống trải quá! Không có khóa học nào ở mục này.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}