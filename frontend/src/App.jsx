import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register'; 
import Login from './pages/Login';
import TestNotificationPage from './pages/TestNotifyPage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Trang chủ (Sẽ làm sau)</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/testnotify" element={<TestNotificationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;