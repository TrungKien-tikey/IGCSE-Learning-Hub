import { useState, useEffect } from "react";
import axios from "axios";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy thông tin user từ localStorage hoặc API
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Đang tải thông tin...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                <div className="md:flex">
                    <div className="p-8 w-full">
                        <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-6">
                            Hồ sơ cá nhân
                        </div>

                        <div className="flex items-center justify-center mb-8">
                            <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-3xl font-bold text-indigo-600">
                                    {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-xs text-gray-400">Tên đăng nhập</p>
                                    <p className="font-medium text-gray-900">{user.username}</p>
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900">{user.email || "Chưa cập nhật"}</p>
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Shield className="w-5 h-5 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-xs text-gray-400">Vai trò</p>
                                    <p className="font-medium text-gray-900 capitalize">
                                        {user.role || "Học sinh"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleLogout}
                                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
