package com.igcse.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho VNPay Payment
 */
public class VNPayDTO {

    /**
     * Request để tạo URL thanh toán VNPay
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePaymentRequest {
        private Long transactionId; // ID giao dịch trong hệ thống
        private String transactionType; // "SLOT" hoặc "COURSE"
        private BigDecimal amount; // Số tiền
        private String orderInfo; // Mô tả đơn hàng
        private String bankCode; // Mã ngân hàng (optional)
        private String language; // "vn" hoặc "en"
    }

    /**
     * Response trả về URL thanh toán
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePaymentResponse {
        private String code; // "00" = success
        private String message;
        private String paymentUrl; // URL redirect đến VNPay
        private String transactionRef; // Mã giao dịch VNPay
    }

    /**
     * Response từ VNPay callback
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VNPayCallbackResponse {
        private String vnpTxnRef; // Mã giao dịch của merchant
        private String vnpAmount; // Số tiền
        private String vnpOrderInfo; // Thông tin đơn hàng
        private String vnpResponseCode; // Mã response: 00 = success
        private String vnpTransactionNo; // Mã giao dịch VNPay
        private String vnpBankCode; // Mã ngân hàng
        private String vnpPayDate; // Thời gian thanh toán
        private String vnpTransactionStatus; // Trạng thái: 00 = success
        private boolean valid; // Chữ ký hợp lệ hay không
        private String message;
    }

    /**
     * Response IPN cho VNPay server
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IPNResponse {
        private String RspCode; // "00" = success, "97" = invalid signature
        private String Message;
    }
}
