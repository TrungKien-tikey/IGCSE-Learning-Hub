import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestNotificationPage from './pages/TestNotifyPage'
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/testnotify" element={<TestNotificationPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;