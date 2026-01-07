import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // <--- Quan trọng: Import file bảo vệ

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

        {/* --- XỬ LÝ LỖI --- */}
        {/* Nếu gõ đường dẫn linh tinh thì tự động về Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;