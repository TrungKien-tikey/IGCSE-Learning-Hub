import React from 'react';
import { 
    BookOpen, Target, Clock, Trophy, Users, ShieldCheck, 
    FileText, TrendingUp, CalendarDays, Calculator, ClipboardList 
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

// Mock user (Cần khớp với layout)
const user = {
    name: "An Nguyen",
    role: "student" // Đổi role ở đây để test giao diện khác
};

// Component thẻ thống kê (Đã chuẩn hóa Tailwind)
const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorStyles = {
    blue: "border-l-blue-500 bg-blue-50 text-blue-600",
    teal: "border-l-teal-500 bg-teal-50 text-teal-600",
    amber: "border-l-amber-500 bg-amber-50 text-amber-600",
    purple: "border-l-purple-500 bg-purple-50 text-purple-600",
  };

  const selectedColor = colorStyles[color] || colorStyles.blue;
  // Tách màu nền icon ra từ chuỗi style trên (logic đơn giản hóa)
  const iconBg = selectedColor.replace("border-l-", "").split(" ")[1]; 

  return (
    <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 ${selectedColor.split(" ")[0]} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} bg-opacity-50`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500">{trend}</p>
    </div>
  );
};

// Data mẫu cho hoạt động gần đây
const activities = [
  { title: "Quadratic Equations", subtitle: "Completed Module 3", time: "2h ago", icon: Calculator, color: "text-blue-600 bg-blue-100" },
  { title: "Algebra Mid-Term", subtitle: "Scored 92/100", time: "Yesterday", icon: Trophy, color: "text-teal-600 bg-teal-100" },
  { title: "Weekly Report", subtitle: "Auto-generated", time: "2 days ago", icon: FileText, color: "text-amber-600 bg-amber-100" },
];

const roleMessages = {
  student: "Ready for another math challenge?",
  teacher: "Managing your classes effectively.",
  admin: "System administration and monitoring.",
};

const Dashboard = () => {
    
  // Hàm render nội dung theo role
  const renderRoleContent = () => {
    switch(user?.role) {
      case 'teacher':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Classes" value="4" icon={Users} color="blue" trend="+1 new" />
            <StatCard title="Total Students" value="124" icon={Users} color="teal" trend="98% active" />
            <StatCard title="Average Grade" value="B+" icon={Trophy} color="amber" trend="Improving" />
            <StatCard title="Tasks Due" value="12" icon={Clock} color="purple" trend="Next: 2h" />
          </div>
        );
      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value="1.2k" icon={Users} color="blue" trend="+5% month" />
            <StatCard title="Server Load" value="12%" icon={ShieldCheck} color="teal" trend="Optimal" />
            <StatCard title="Storage" value="84%" icon={FileText} color="amber" trend="Monitor" />
            <StatCard title="Revenue" value="$42k" icon={TrendingUp} color="purple" trend="Growing" />
          </div>
        );
      default: // student
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Modules Done" value="12/24" icon={BookOpen} color="blue" trend="+2 this week" />
            <StatCard title="Average Score" value="87%" icon={Target} color="teal" trend="Top 15%" />
            <StatCard title="Study Hours" value="24.5h" icon={Clock} color="amber" trend="Last 30 days" />
            <StatCard title="Badges" value="8" icon={Trophy} color="purple" trend="New unlocked!" />
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              {user?.role === 'student' ? 'Welcome back,' : 'Hello,'} <span className="text-blue-600">{user?.name}</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Role: <span className="capitalize font-semibold text-blue-500">{user?.role}</span> • {roleMessages[user?.role || 'student']}
            </p>
          </div>
        </div>

        {/* Dynamic Role Stats */}
        <div className="animate-fade-in-up">
            {renderRoleContent()}
        </div>

        {/* Bottom Grid */}
        <div className="grid md:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold font-serif text-gray-800">Recent Activity</h2>
                    <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
                </div>
                
                <div className="space-y-4">
                    {activities.map((act, i) => (
                        <div key={i} className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
                             <div className={`w-12 h-12 rounded-lg ${act.color} flex items-center justify-center shrink-0 mr-4`}>
                                <act.icon className="w-6 h-6" />
                             </div>
                             <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{act.title}</h3>
                                <p className="text-xs text-gray-500">{act.subtitle}</p>
                             </div>
                             <div className="text-sm font-medium text-gray-400">
                                {act.time}
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold font-serif text-gray-800 mb-4">Quick Links</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                    {[
                        { title: "Learning Resources", icon: BookOpen },
                        { title: "Past Papers", icon: FileText },
                        { title: "System Support", icon: ShieldCheck },
                    ].map((link, i) => (
                        <button key={i} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium group">
                            <link.icon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                            {link.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;