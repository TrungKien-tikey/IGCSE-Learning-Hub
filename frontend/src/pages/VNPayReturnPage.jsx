import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, RefreshCw } from 'lucide-react';
import { paymentService } from '../api/paymentService';
import './VNPayReturnPage.css';

/**
 * Trang hiển thị kết quả thanh toán VNPay
 * VNPay sẽ redirect user về đây sau khi hoàn tất thanh toán
 */
const VNPayReturnPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        verifyPayment();
    }, []);

    const verifyPayment = async () => {
        try {
            setLoading(true);

            // Lấy tất cả params từ URL và gửi về backend verify
            const params = {};
            searchParams.forEach((value, key) => {
                params[key] = value;
            });

            console.log('VNPay return params:', params);

            // Gọi API backend để verify kết quả
            const response = await paymentService.verifyVNPayReturn(params);
            setResult(response);

        } catch (err) {
            console.error('Error verifying VNPay payment:', err);
            setError(err.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = result?.valid && result?.vnpTransactionStatus === '00';

    if (loading) {
        return (
            <div className="vnpay-return-page">
                <div className="vnpay-card loading">
                    <Loader2 className="spinner" size={48} />
                    <h2>Đang xác nhận thanh toán...</h2>
                    <p>Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vnpay-return-page">
                <div className="vnpay-card error">
                    <XCircle className="icon error-icon" size={64} />
                    <h2>Lỗi xác nhận thanh toán</h2>
                    <p className="error-message">{error}</p>
                    <div className="actions">
                        <button onClick={() => verifyPayment()} className="btn-retry">
                            <RefreshCw size={18} />
                            Thử lại
                        </button>
                        <button onClick={() => navigate('/')} className="btn-home">
                            <Home size={18} />
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vnpay-return-page">
            <div className={`vnpay-card ${isSuccess ? 'success' : 'failed'}`}>
                {isSuccess ? (
                    <CheckCircle className="icon success-icon" size={64} />
                ) : (
                    <XCircle className="icon error-icon" size={64} />
                )}

                <h2>{isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}</h2>
                <p className="message">{result?.message}</p>

                <div className="payment-details">
                    <div className="detail-row">
                        <span className="label">Mã giao dịch:</span>
                        <span className="value">{result?.vnpTxnRef || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Số tiền:</span>
                        <span className="value">
                            {result?.vnpAmount
                                ? new Intl.NumberFormat('vi-VN').format(parseInt(result.vnpAmount) / 100) + ' VNĐ'
                                : 'N/A'}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Ngân hàng:</span>
                        <span className="value">{result?.vnpBankCode || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Mã GD VNPay:</span>
                        <span className="value">{result?.vnpTransactionNo || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Thời gian:</span>
                        <span className="value">{result?.vnpPayDate || 'N/A'}</span>
                    </div>
                </div>

                <div className="actions">
                    {isSuccess ? (
                        <>
                            <button onClick={() => navigate('/my-courses')} className="btn-primary">
                                Xem khóa học của tôi
                            </button>
                            <button onClick={() => navigate('/')} className="btn-secondary">
                                <Home size={18} />
                                Về trang chủ
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate(-1)} className="btn-primary">
                                Thử lại
                            </button>
                            <button onClick={() => navigate('/')} className="btn-secondary">
                                <Home size={18} />
                                Về trang chủ
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VNPayReturnPage;
