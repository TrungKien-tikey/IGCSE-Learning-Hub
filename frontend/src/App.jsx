import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- AUTH PAGES (Đã chuyển vào thư mục auth) ---
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword'; // File sắp tạo
import ResetPassword from './pages/auth/ResetPassword';   // File sắp tạo

// --- USER PAGES (Của bạn User Service) ---
import Profile from './pages/Profile'; 

// --- CÁC TRANG KHÁC (Giữ nguyên) ---
import Dashboard from './pages/Dashboard';
import TestNotificationPage from './pages/TestNotifyPage'
import ChatPage from "./pages/ChatPage";
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Exam Pages
import ExamListPage from "./pages/exams/ExamList";
import ManageExamsPage from "./pages/exams/ExamManage";
import EditExamPage from "./pages/exams/ExamEdit";
import ExamAttemptPage from "./pages/exams/ExamAttempt";
import ExamResultPage from "./pages/exams/ExamResult";
import CreateExamPage from './pages/exams/ExamCreate';

// AI Pages
import AIHomePage from './pages/ai/AIHomePage';
import AIResultPage from './pages/ai/AIResultPage';
import StudentDashboard from './pages/ai/StudentDashboard';
import TeacherDashboard from './pages/ai/TeacherDashboard';
import AdminDashboardAI from './pages/ai/AdminDashboard';

// Course Pages
import CoursePage from './pages/course/CoursePage';
import LessonPage from './pages/course/LessonPage';
import CourseDetailPage from './pages/course/CourseDetailPage';
import AllCoursesPage from './pages/course/AllCoursesPage';
import MyCoursesPage from './pages/course/MyCoursesPage';
import StudentLearningPage from './pages/course/StudentLearningPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- KHU VỰC ĐƯỢC BẢO VỆ --- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* --- KHU VỰC AUTH (Login, Register, Quên MK) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 👉 2 Route mới cho chức năng Quên Mật Khẩu */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* --- CÁC TRANG CÔNG KHAI KHÁC --- */}
        <Route path="/testnotify" element={<TestNotificationPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* --- EXAM ROUTES --- */}
        <Route path="/exams" element={<ExamListPage />} />
        <Route path="/exams/create" element={<CreateExamPage />} />
        <Route path="/exams/manage" element={<ManageExamsPage />} />
        <Route path="/exams/edit/:id" element={<EditExamPage />} />
        <Route path="/exams/:id/attempt" element={<ExamAttemptPage />} />
        <Route path="/exams/result" element={<ExamResultPage />} />

        {/* --- COURSE ROUTES --- */}
        <Route path="course/courses" element={<CoursePage />} />
        <Route path="/courses/:courseId/lessons" element={<LessonPage />} />
        <Route path="/course-detail/:courseId" element={<CourseDetailPage />} />
        <Route path="/all-courses" element={<AllCoursesPage />} />
        <Route path="/my-courses" element={<MyCoursesPage />} />
        <Route path="/learning/:courseId" element={<StudentLearningPage />} />

        {/* --- AI ROUTES --- */}
        <Route path="/ai" element={<AIHomePage />} />
        <Route path="/ai/results/:attemptId" element={<AIResultPage />} />

        <Route
          path="/ai/dashboard/student"
          element={
            <RoleProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <StudentDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/ai/dashboard/teacher"
          element={
            <RoleProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <TeacherDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/ai/dashboard/admin"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardAI />
            </RoleProtectedRoute>
          }
        />

        {/* --- XỬ LÝ LỖI (404) --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;