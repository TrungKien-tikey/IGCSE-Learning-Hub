import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calculator, BarChart3, FileText, User, LogOut, 
  Users, ShieldCheck, ClipboardList, BookOpen, GraduationCap, 
  Home, Settings, TrendingUp 
} from 'lucide-react';

// Giả lập user (Sau này sẽ lấy từ Context/LocalStorage thực tế)
const mockUser = {
  name: "An Nguyen",
  role: "student", // Thử đổi thành 'teacher', 'admin' để xem giao diện khác
  username: "an2005"
};

const menuItems = {
  student: [
    { title: "Dashboard", icon: Home, url: "/" },
    { title: "Math Modules", icon: Calculator, url: "/modules" },
    { title: "My Progress", icon: BarChart3, url: "/progress" },
    { title: "Practice Exams", icon: GraduationCap, url: "/exams" },
  ],
  teacher: [
    { title: "Overview", icon: LayoutDashboard, url: "/" },
    { title: "My Classes", icon: Users, url: "/classes" },
    { title: "Curriculum", icon: BookOpen, url: "/modules" },
    { title: "Grading", icon: ClipboardList, url: "/grading" },
  ],
  admin: [
    { title: "System Health", icon: Home, url: "/" },
    { title: "User Management", icon: Users, url: "/users" },
    { title: "System Logs", icon: ShieldCheck, url: "/logs" },
    { title: "Global Settings", icon: Settings, url: "/settings" },
  ],
};

const SidebarItem = ({ icon: Icon, text, url, active }) => (
  <Link to={url}>
    <li className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Icon size={20} />
      <span className="font-medium">{text}</span>
    </li>
  </Link>
);

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Xác định menu dựa trên role
  const role = mockUser.role || "student";
  const items = menuItems[role] || menuItems["student"];

  const handleLogout = () => {
    // Xử lý logout giả lập
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* --- LEFT SIDEBAR --- */}
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Main Navigation</p>
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
          <ul className="space-y-1">
            <SidebarItem icon={User} text="Profile" url="/profile" />
            <li onClick={handleLogout} className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* --- RIGHT CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
           <div className="text-sm font-medium text-gray-500">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
           </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{mockUser.name}</p>
                <p className="text-xs text-blue-500 font-medium capitalize">{mockUser.role}</p>
             </div>
             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                 {mockUser.username.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;