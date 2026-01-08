import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // <--- Quan trọng: Import file bảo vệ

import ExamListPage from "./pages/exams/ExamList"; // Ví dụ: file ExamsList.tsx
import ManageExamsPage from "./pages/exams/ExamManage";
import EditExamPage from "./pages/exams/ExamEdit"; 
import ExamAttemptPage from "./pages/exams/ExamAttempt"; 
import ExamResultPage from "./pages/exams/ExamResult";
import CreateExamPage from './pages/exams/ExamCreate';
import CoursePage from './pages/CoursePage';

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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/exams" element={<ExamListPage />} />
        <Route path="/exams/create" element={<CreateExamPage />} />
        <Route path="/exams/manage" element={<ManageExamsPage />} />
        <Route path="/exams/edit/:id" element={<EditExamPage />} />
        <Route path="/exams/:id/attempt" element={<ExamAttemptPage />} />
        <Route path="/exams/result" element={<ExamResultPage />} />
        <Route path="/courses" element={<CoursePage />} />

                {/* --- XỬ LÝ LỖI --- */}
                {/* Nếu gõ đường dẫn linh tinh thì tự động về Login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;