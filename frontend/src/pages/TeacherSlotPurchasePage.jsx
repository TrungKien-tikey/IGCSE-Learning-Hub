import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    ShoppingCart, CreditCard, Clock, Activity,
    Shield, CheckCircle, AlertTriangle, Package
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import {
    getActivePackages,
    purchaseSlotPackage,
    getTeacherSlots
} from '../api/paymentService'; // Đảm bảo import đúng đường dẫn
import userClient from '../api/userClient'; // Dùng cho user-service API

// Format tiền VNĐ
const formatCurrency = (value) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

export default function TeacherSlotPurchasePage() {
    const [packages, setPackages] = useState([]);
    const [currentSlots, setCurrentSlots] = useState({ totalSlots: 0, usedSlots: 0, availableSlots: 0 });
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    // User info
    const [teacherId, setTeacherId] = useState(null);
    const [teacherName, setTeacherName] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Lấy thông tin user hiện tại
                const res = await userClient.get('/me');
                if (res.data) {
                    setTeacherId(res.data.userId || res.data.id);
                    setTeacherName(res.data.fullName);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                toast.error("Không thể lấy thông tin người dùng");
            }
        };
        fetchUserData();
    }, []);

    const fetchData = async () => {
        if (!teacherId) return;
        setLoading(true);
        try {
            const [pkgs, slots] = await Promise.all([
                getActivePackages(),
                getTeacherSlots(teacherId)
            ]);
            setPackages(pkgs || []);
            if (slots) setCurrentSlots(slots);
        } catch (error) {
            console.error('Error fetching data:', error);
            // toast.error('Lỗi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (teacherId) {
            fetchData();
        }
    }, [teacherId]);

    const handlePurchase = async (pkg) => {
        if (!window.confirm(`Xác nhận mua gói "${pkg.name}" với giá ${formatCurrency(pkg.price)}?`)) {
            return;
        }

        setPurchasing(true);
        try {
            const requestData = {
                teacherId: teacherId,
                teacherName: teacherName,
                packageId: pkg.id,
                paymentMethod: "BANK_TRANSFER", // Mặc định
                notes: "Mua qua trang web"
            };

            const result = await purchaseSlotPackage(requestData);

            if (result.success) {
                toast.success(`🎉 ${result.message}`);
                // Hiển thị lựa chọn thanh toán
                const paymentChoice = window.confirm(
                    `Bạn muốn thanh toán qua VNPay?\n\n` +
                    `- Nhấn OK để thanh toán qua VNPay\n` +
                    `- Nhấn Cancel để chuyển khoản thủ công`
                );

                if (paymentChoice) {
                    // Thanh toán qua VNPay
                    handleVNPayPayment(result.transactionId, result.amount, pkg.name);
                } else {
                    // Hiển thị thông tin chuyển khoản
                    alert(`Vui lòng chuyển khoản ${formatCurrency(result.amount)} đến STK: 123456789 (Vietcombank) - Nội dung: "MUA SLOT ${result.transactionId}"`);
                }
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.response?.data?.message || "Lỗi giao dịch!");
        } finally {
            setPurchasing(false);
        }
    };

    const handleVNPayPayment = async (transactionId, amount, packageName) => {
        try {
            console.log('=== handleVNPayPayment called ===');
            console.log('transactionId:', transactionId);
            console.log('amount:', amount);
            console.log('packageName:', packageName);

            const { createVNPayPayment } = await import('../api/paymentService');

            const vnpayResponse = await createVNPayPayment({
                transactionId: transactionId,
                transactionType: "SLOT",
                amount: amount,
                orderInfo: `Mua goi suat hoc: ${packageName}`,
                language: "vn"
            });

            console.log('VNPay response:', vnpayResponse);

            if (vnpayResponse.code === "00" && vnpayResponse.paymentUrl) {
                console.log('Redirecting to:', vnpayResponse.paymentUrl);
                // Redirect đến VNPay
                window.location.href = vnpayResponse.paymentUrl;
            } else {
                console.error('VNPay response not OK:', vnpayResponse);
                toast.error(vnpayResponse.message || "Không thể tạo URL thanh toán VNPay");
            }
        } catch (error) {
            console.error('VNPay payment error:', error);
            toast.error("Lỗi kết nối VNPay. Vui lòng thử lại hoặc chuyển khoản thủ công.");
        }
    };

    if (!teacherId && !loading) return <div className="p-8 text-center">Vui lòng đăng nhập...</div>;

    return (
        <MainLayout>
            <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                <ShoppingCart className="w-8 h-8" />
                                Mua Gói Suất Học
                            </h1>
                            <p className="text-indigo-100 opacity-90 max-w-lg">
                                Nâng cấp tài khoản giảng viên của bạn để tạo thêm khóa học.
                                Chọn gói phù hợp nhất với nhu cầu của bạn.
                            </p>
                        </div>

                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 min-w-[200px] border border-white/30">
                            <div className="text-sm font-medium opacity-80 mb-1">Số suất khả dụng</div>
                            <div className="text-4xl font-extrabold flex items-baseline gap-2">
                                {loading ? '...' : currentSlots.availableSlots || 0}
                                <span className="text-lg font-normal opacity-80">suất</span>
                            </div>
                            <div className="text-xs mt-2 opacity-75">
                                Đã dùng: {currentSlots.usedSlots || 0} / Tổng: {currentSlots.totalSlots || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Bảo mật thanh toán</h3>
                            <p className="text-sm text-slate-500 mt-1">Giao dịch an toàn và minh bạch qua chuyển khoản ngân hàng.</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Kích hoạt nhanh chóng</h3>
                            <p className="text-sm text-slate-500 mt-1">Suất học sẽ được cộng vào tài khoản ngay sau khi Admin xác nhận.</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Thời hạn lâu dài</h3>
                            <p className="text-sm text-slate-500 mt-1">Các gói suất học có thời hạn sử dụng lên đến 1 năm hoặc vĩnh viễn.</p>
                        </div>
                    </div>
                </div>

                {/* Packages Grid */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-600" />
                        Danh Sách Gói Đang Bán
                    </h2>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-slate-500 mt-4">Đang tải danh sách gói...</p>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Hiện tại chưa có gói suất học nào được mở bán.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {packages.map((pkg, idx) => (
                                <div
                                    key={pkg.id}
                                    className={`relative bg-white rounded-3xl p-8 border hover:shadow-2xl transition-all duration-300 group ${idx === 1 ? 'border-2 border-indigo-500 shadow-xl scale-105 z-10' : 'border-slate-100 shadow-lg'
                                        }`}
                                >
                                    {idx === 1 && (
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                            Phổ biến nhất
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{pkg.name}</h3>
                                        <div className="text-4xl font-extrabold text-slate-900 mb-1">
                                            {formatCurrency(pkg.price)}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            cho {pkg.slotCount} suất học
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="p-1 bg-green-100 rounded-full text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">{pkg.slotCount} suất tạo khóa học</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="p-1 bg-green-100 rounded-full text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span>Thời hạn {pkg.durationDays} ngày</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="p-1 bg-green-100 rounded-full text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span>Hỗ trợ 24/7</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-slate-600">
                                            <div className="p-1 bg-green-100 rounded-full text-green-600 mt-0.5">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm">{pkg.description || "Gói tiêu chuẩn cho giáo viên"}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handlePurchase(pkg)}
                                        disabled={purchasing}
                                        className={`w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${idx === 1
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                            }`}
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        {purchasing ? 'Đang xử lý...' : 'Mua Ngay'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Warning note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-800">Lưu ý quan trọng</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            Sau khi thực hiện yêu cầu mua, vui lòng chuyển khoản đúng số tiền và nội dung để Admin xác nhận.
                            Giao dịch thường được xử lý trong vòng 24h làm việc.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
