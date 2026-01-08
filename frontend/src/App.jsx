import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // <--- Quan trọng: Import file bảo vệ

// AI Module Pages
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

        {/* --- AI MODULE ROUTES --- */}
        <Route path="/ai" element={<AIHomePage />} />
        <Route path="/ai/results/:attemptId" element={<AIResultPage />} />
        <Route path="/ai/dashboard/student" element={<StudentDashboard />} />

        {/* --- KHU VỰC CÔNG KHAI (Ai cũng vào được) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- XỬ LÝ LỖI --- */}
        {/* Nếu gõ đường dẫn linh tinh thì tự động về Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
