import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import TestNotificationPage from './pages/TestNotifyPage'
import ChatPage from "./pages/ChatPage";
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute'; // <--- Quan trọng: Import file bảo vệ

// Exam Pages
import ExamListPage from "./pages/exams/ExamList";
import ManageExamsPage from "./pages/exams/ExamManage";
import EditExamPage from "./pages/exams/ExamEdit";
import ExamAttemptPage from "./pages/exams/ExamAttempt";
import ExamResultPage from "./pages/exams/ExamResult";
import CreateExamPage from './pages/exams/ExamCreate';
import CoursePage from './pages/CoursePage';

// AI Pages
import AIHomePage from './pages/ai/AIHomePage';
import AIResultPage from './pages/ai/AIResultPage';
import StudentDashboard from './pages/ai/StudentDashboard';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- KHU VỰC ĐƯỢC BẢO VỆ (Cần đăng nhập mới vào được) --- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* --- KHU VỰC CÔNG KHAI (Ai cũng vào được) --- */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />
        <Route path="/testnotify" element={<TestNotificationPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/exams" element={<ExamListPage />} />
        <Route path="/exams/create" element={<CreateExamPage />} />
        <Route path="/exams/manage" element={<ManageExamsPage />} />
        <Route path="/exams/edit/:id" element={<EditExamPage />} />
        <Route path="/exams/:id/attempt" element={<ExamAttemptPage />} />
        <Route path="/exams/result" element={<ExamResultPage />} />
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/profile" element={<Profile />} />

        {/* --- AI SECTIONS (Dùng để test NiFi integration) --- */}
        <Route path="/ai" element={<AIHomePage />} />
        <Route path="/ai/results/:attemptId" element={<AIResultPage />} />
        <Route path="/ai/dashboard/student" element={<StudentDashboard />} />

        {/* --- XỬ LÝ LỖI --- */}
        {/* Nếu gõ đường dẫn linh tinh thì tự động về Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App;
