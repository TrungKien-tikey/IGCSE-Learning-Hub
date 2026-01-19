import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import './AdminCourseApprovalPage.css'; // Chúng ta sẽ tạo file CSS này ở bước 2

export default function AdminCourseApprovalPage() {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:8079/api/courses';

  // Hàm lấy Header chứa Token (Dùng localStorage hoặc localStorage như bạn đã chốt)
  const getAuthConfig = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Tải danh sách khóa học và lọc những khóa CHƯA ACTIVE
  const fetchPendingCourses = async () => {
    try {
      const config = getAuthConfig();
      const res = await axios.get(API_URL, config);
      
      // Logic: Chỉ lấy những khóa có active === false (hoặc null)
      const unapproved = res.data.filter(c => !c.active);
      setPendingCourses(unapproved);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      if (err.response?.status === 401) {
        alert("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  // Xử lý Duyệt (Activate)
  const handleApprove = async (courseId) => {
    if (window.confirm("Bạn xác nhận DUYỆT khóa học này? Khóa học sẽ được hiển thị cho học sinh.")) {
      try {
        // API: PUT /api/courses/{id}/activate
        await axios.put(`${API_URL}/${courseId}/activate`, {}, getAuthConfig());
        alert("✅ Đã duyệt khóa học thành công!");
        
        // Refresh lại danh sách (Loại bỏ khóa vừa duyệt)
        setPendingCourses(prev => prev.filter(c => c.courseId !== courseId));
      } catch (err) {
        alert("Lỗi khi duyệt: " + (err.response?.data || err.message));
      }
    }
  };

  // Xử lý Từ chối (Xóa hoặc giữ nguyên)
  // Ở đây mình làm chức năng XÓA luôn nếu từ chối (Tùy nghiệp vụ của bạn)
  const handleReject = async (courseId) => {
    const reason = prompt("Nhập lý do từ chối (để gửi thông báo cho giáo viên):");
    if (reason !== null) { // Nếu không bấm Cancel
      try {
        // Gọi API Xóa (Hoặc bạn có thể viết thêm API /reject riêng để đổi trạng thái)
        await axios.delete(`${API_URL}/${courseId}`, getAuthConfig());
        alert("Đã từ chối và xóa khóa học.");
        setPendingCourses(prev => prev.filter(c => c.courseId !== courseId));
      } catch (err) {
        alert("Lỗi khi từ chối: " + err.message);
      }
    }
  };

  // Xem chi tiết (Chuyển sang trang detail hoặc modal)
  const handleViewDetail = (courseId) => {
    navigate(`/course-detail/${courseId}`); 
  };

  if (loading) return <div className="admin-loading">Đang tải danh sách chờ duyệt...</div>;

  return (
    <div className="admin-approval-container">
      <div className="admin-header">
        <h1>🛡️ Xét Duyệt Khóa Học</h1>
        <p>Danh sách các khóa học đang chờ phê duyệt công khai</p>
      </div>

      <div className="approval-table-wrapper">
        {pendingCourses.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="#4caf50" />
            <p>Tuyệt vời! Không còn khóa học nào chờ duyệt.</p>
          </div>
        ) : (
          <table className="approval-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Khóa Học</th>
                <th>Giáo Viên</th>
                <th>Giá</th>
                <th>Thời lượng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingCourses.map((course) => (
                <tr key={course.courseId}>
                  <td>#{course.courseId}</td>
                  <td className="fw-bold">{course.title}</td>
                  <td>{course.teacherName || "Nguyễn Văn A"}</td> {/* Nếu chưa có field teacherName thì giả lập */}
                  <td>{course.price > 0 ? `$${course.price}` : <span className="tag-free">Miễn phí</span>}</td>
                  <td>{course.duration}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-view" 
                        title="Xem nội dung"
                        onClick={() => handleViewDetail(course.courseId)}
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="btn-icon btn-approve" 
                        title="Duyệt"
                        onClick={() => handleApprove(course.courseId)}
                      >
                        <CheckCircle size={18} /> Duyệt
                      </button>
                      <button 
                        className="btn-icon btn-reject" 
                        title="Từ chối"
                        onClick={() => handleReject(course.courseId)}
                      >
                        <XCircle size={18} /> Bỏ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}