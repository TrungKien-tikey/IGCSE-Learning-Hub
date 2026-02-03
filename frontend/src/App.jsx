import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- AUTH PAGES (Đã chuyển vào thư mục auth) ---
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword'; // File sắp tạo
import ResetPassword from './pages/auth/ResetPassword';   // File sắp tạo

// --- USER PAGES (Của bạn User Service) ---
import Profile from './pages/Profile';

// --- CÁC TRANG KHÁC (Giữ nguyên) ---
import Dashboard from './pages/Dashboard';

import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AdminCourseApprovalPage from './pages/AdminCourseApprovalPage';
import TeacherVerification from './pages/admin/TeacherVerification';
import VerifiedRoute from './components/VerifiedRoute';
import AdminSlotPackagesPage from './pages/AdminSlotPackagesPage';

import TeacherSlotPurchasePage from './pages/TeacherSlotPurchasePage';

// Exam Pages
import ExamListPage from "./pages/exams/ExamList";
import ManageExamsPage from "./pages/exams/ExamManage";
import EditExamPage from "./pages/exams/ExamEdit";
import ExamAttemptPage from "./pages/exams/ExamAttempt";
import ExamResultPage from "./pages/exams/ExamResult";
import CreateExamPage from './pages/exams/ExamCreate';
import TeacherGradingPage from "./pages/exams/TeacherGradingPage";
import ExamReviewPage from "./pages/exams/ExamReviewPage";

// AI Pages
import AIHomePage from './pages/ai/AIHomePage';
import AIResultPage from './pages/ai/AIResultPage';
import StudentDashboard from './pages/ai/StudentDashboard';
import TeacherDashboard from './pages/ai/TeacherDashboard';
import AdminDashboardAI from './pages/ai/AdminDashboard';
import ParentDashboard from './pages/ai/ParentDashboard';

// Course Pages
import CoursePage from './pages/course/CoursePage';
import LessonPage from './pages/course/LessonPage';
import CourseDetailPage from './pages/course/CourseDetailPage';
import AllCoursesPage from './pages/course/AllCoursesPage';
import MyCoursesPage from './pages/course/MyCoursesPage';
import StudentLearningPage from './pages/course/StudentLearningPage';

//Comunication page
import NotificationsPage from './pages/communication/NotificationsPage';
import ChatPage from "./pages/communication/ChatPage";

// Payment Pages
import VNPayReturnPage from './pages/VNPayReturnPage';

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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* --- EXAM ROUTES --- */}
        <Route path="/exams" element={<ProtectedRoute><ExamListPage /></ProtectedRoute>} />
        <Route
          path="/exams/create"
          element={
            <VerifiedRoute>
              <CreateExamPage />
            </VerifiedRoute>
          }
        />
        <Route
          path="/exams/manage"
          element={
            <VerifiedRoute>
              <ManageExamsPage />
            </VerifiedRoute>
          }
        />
        <Route
          path="/exams/edit/:id"
          element={
            <VerifiedRoute>
              <EditExamPage />
            </VerifiedRoute>
          }
        />
        <Route path="/exams/:id/attempt" element={<ProtectedRoute><ExamAttemptPage /></ProtectedRoute>} />
        <Route path="/exams/result" element={<ProtectedRoute><ExamResultPage /></ProtectedRoute>} />
        {/* <Route path="/teacher/grading" element={<TeacherGradingPage />} /> */}
        <Route
          path="/teacher/grading"
          element={
            <VerifiedRoute>
              <TeacherGradingPage />
            </VerifiedRoute>
          }
        />
        <Route path="/exams/review/:attemptId" element={<ExamReviewPage />} />

        {/* --- COURSE ROUTES --- */}
        <Route path="course/courses" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
        <Route path="/courses/:courseId/lessons" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
        <Route path="/course-detail/:courseId" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
        <Route path="/all-courses" element={<ProtectedRoute><AllCoursesPage /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
        <Route path="/learning/:courseId" element={<StudentLearningPage />} />

        {/* --- AI ROUTES --- */}
        <Route path="/ai" element={<AIHomePage />} />
        <Route path="/ai/results/:attemptId" element={<AIResultPage />} />

        {/* --- Comunication ROUTES --- */}
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* --- PAYMENT ROUTES --- */}
        <Route path="/payment/vnpay-return" element={<ProtectedRoute><VNPayReturnPage /></ProtectedRoute>} />

        <Route
          path="/ai/dashboard/student"
          element={
            <RoleProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'TEACHER', 'PARENT']}>
              <StudentDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/ai/dashboard/teacher"
          element={
            <VerifiedRoute>
              <TeacherDashboard />
            </VerifiedRoute>
          }
        />

        <Route
          path="/teacher/buy-slots"
          element={
            <VerifiedRoute>
              <TeacherSlotPurchasePage />
            </VerifiedRoute>
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

        <Route
          path="/admin/verify"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <TeacherVerification />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/ai/dashboard/parent/:studentId"
          element={
            <RoleProtectedRoute allowedRoles={['PARENT', 'ADMIN']}>
              <ParentDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route path="/progress" element={<Navigate to="/ai/dashboard/student" replace />} />
        <Route path="/reports" element={<Navigate to="/ai/dashboard/student" replace />} />

        <Route
          path="/course-approval"
          element={
            <RoleProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <AdminCourseApprovalPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/slot-packages"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSlotPackagesPage />
            </RoleProtectedRoute>
          }
        />

        {/* --- XỬ LÝ LỖI (404) --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
}

export default App;