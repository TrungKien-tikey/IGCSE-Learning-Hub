import React, { useEffect, useState } from 'react'; // [UPDATED] Thêm useEffect và useState
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calculator, BarChart3, FileText, User, LogOut,
  Users, ShieldCheck, ClipboardList, BookOpen, GraduationCap,
  Home, Settings, TrendingUp, ShoppingCart, Bell,
  PlayCircle, Menu, X, Award
} from 'lucide-react';

// [UPDATED] Import các thư viện cần thiết cho Notification
import { requestForToken, onMessageListener } from '../firebase'; // Đảm bảo đường dẫn đúng tới file firebase.ts/.js của bạn
import axiosClient from '../api/axiosClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const menuItems = {
  student: [
    { title: "Tổng quan", icon: Home, url: "/" },
    { title: "Bài kiểm tra", icon: GraduationCap, url: "/exams" },
    // { title: "Kết quả bài thi", icon: Award, url: "/ai" },
    { title: "Mua Khóa Học", icon: ShoppingCart, url: "/all-courses" },
    { title: "Vào Lớp Học", icon: PlayCircle, url: "/my-courses" },
    { title: "Thông báo", icon: Bell, url: "/notifications" },
  ],
  teacher: [
    { title: "Tổng quan", icon: LayoutDashboard, url: "/" },
    // { title: "Quản lý giảng dạy", icon: FileText, url: "/course/courses" },
    { title: "Quản lý bài kiểm tra", icon: GraduationCap, url: "/exams/manage" },
    { title: "Mua Suất Học", icon: ShoppingCart, url: "/teacher/buy-slots" },
    // { title: "Đánh giá", icon: ClipboardList, url: "/grading" },
  ],
  admin: [
    { title: "Tổng quan", icon: Home, url: "/" },
    { title: "Quản lý người dùng", icon: Users, url: "/admin/dashboard" },
    { title: "Gói suất học", icon: ShoppingCart, url: "/admin/slot-packages" },
  ],
  parent: [
    { title: "Tổng quan", icon: Home, url: "/" },
    { title: "Tiến độ học sinh", icon: BarChart3, url: "/progress" },
    { title: "Báo cáo học tập", icon: FileText, url: "/reports" },
  ],
};

const SidebarItem = ({ icon: Icon, text, url, active, onClick }) => (
  <Link to={url} onClick={onClick}>
    <li className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Icon size={20} />
      <span className="font-medium">{text}</span>
    </li>
  </Link>
);

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State quản lý User để trigger re-render khi cập nhật
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch user profile if missing
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser.fullName || !currentUser.email) {
        try {
          const res = await axiosClient.get('/users/me', { baseURL: '/api' });
          if (res.data) {
            setCurrentUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
            // Update role if needed
            if (res.data.role) {
              localStorage.setItem("userRole", res.data.role);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user profile in layout:", error);
        }
      }
    };
    fetchProfile();
  }, []);

  const mockUser = {
    name: currentUser.fullName || "User",
    role: (currentUser.role || localStorage.getItem("userRole") || "student").toLowerCase(),
    username: currentUser.email?.split('@')[0] || "user"
  };

  // Xác định menu dựa trên role
  const role = mockUser.role || "student";
  let items = menuItems[role] || menuItems["student"];

  // Nếu là Phụ huynh và đã liên kết học sinh, gắn StudentId vào URL nếu cần
  if (role === 'parent') {
    const linkedStudent = JSON.parse(localStorage.getItem("linkedStudent") || "null");
    if (linkedStudent && linkedStudent.userId) {
      items = items.map(item => {
        if (item.url === '/progress' || item.url === '/reports') {
          return { ...item, url: `/ai/dashboard/student?studentId=${linkedStudent.userId}` };
        }
        return item;
      });
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  // --- [UPDATED] LOGIC NOTIFICATION BẮT ĐẦU TẠI ĐÂY ---
  useEffect(() => {
    const registerFCMToken = async () => {
      try {
        // 1. Gọi đúng tên hàm requestForToken từ file firebase.ts
        const fcmToken = await requestForToken();

        if (fcmToken) {
          // 2. Gọi đúng endpoint /subscribe đã định nghĩa trong NotificationController
          // 3. Gửi dữ liệu dưới dạng JSON Body (Map) thay vì Query Parameter
          await axiosClient.post("/notifications/subscribe", {
            token: fcmToken
          });
          console.log("FCM Token registered and subscribed to 'students' topic");

        }
      } catch (error) {
        console.error("Error registering FCM token:", error);
      }
    };

    if (currentUser && (currentUser.id || currentUser.userId)) {
      registerFCMToken();
    }

    // Lắng nghe tin nhắn khi App đang mở (Foreground)
    onMessageListener()
      .then((payload) => {
        // Hiển thị Toast cho giao diện web
        toast.info(`${payload.notification.title}: ${payload.notification.body}`);

        // Ép trình duyệt hiển thị thông báo hệ thống ngay cả khi đang mở Tab
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/vite.svg'
        });
      });
  }, []); // Chỉ chạy 1 lần khi component mount
  // --- [UPDATED] KẾT THÚC LOGIC NOTIFICATION ---

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* [UPDATED] Thêm ToastContainer để hiển thị thông báo */}
      <ToastContainer />

      {/* --- LEFT SIDEBAR (Desktop) --- */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">IGCSE Hub</span>
          </div>

          {/* Menu */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chuyển hướng </p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <SidebarItem
                    key={item.title}
                    icon={item.icon}
                    text={item.title}
                    url={item.url}
                    active={location.pathname === item.url}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="mt-auto p-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tài khoản</p>
          <ul className="space-y-1">
            <SidebarItem icon={User} text="Thông tin" url="/profile" active={location.pathname === "/profile"} />
            <li onClick={handleLogout} className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={20} />
              <span className="font-medium">Đăng xuất</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* --- RIGHT CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-20">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <div className="text-xs sm:text-sm font-medium text-gray-500 flex-1 text-center md:text-left md:flex-none">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{mockUser.name}</p>
              <p className="text-xs text-blue-500 font-medium capitalize">{mockUser.role}</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 overflow-hidden flex-shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                mockUser.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 md:hidden flex flex-col shadow-xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-800 tracking-tight">IGCSE Hub</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chuyển hướng</p>
                    <ul className="space-y-1">
                      {items.map((item) => (
                        <SidebarItem
                          key={item.title}
                          icon={item.icon}
                          text={item.title}
                          url={item.url}
                          active={location.pathname === item.url}
                          onClick={() => setMobileMenuOpen(false)}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tài khoản</p>
                <ul className="space-y-1">
                  <SidebarItem icon={User} text="Thông tin" url="/profile" active={location.pathname === "/profile"} onClick={() => setMobileMenuOpen(false)} />
                  <li onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Đăng xuất</span>
                  </li>
                </ul>
              </div>
            </aside>
          </>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default MainLayout;