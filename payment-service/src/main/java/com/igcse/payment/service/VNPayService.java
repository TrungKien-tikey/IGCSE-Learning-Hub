package com.igcse.payment.service;

import com.igcse.payment.config.VNPayConfig;
import com.igcse.payment.dto.VNPayDTO;
import com.igcse.payment.entity.CourseTransaction;
import com.igcse.payment.entity.SlotTransaction;
import com.igcse.payment.repository.CourseTransactionRepository;
import com.igcse.payment.repository.SlotTransactionRepository;
import com.igcse.payment.util.VNPayUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Service xử lý thanh toán qua VNPay
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {

    private final VNPayConfig vnPayConfig;
    private final SlotTransactionRepository slotTransactionRepository;
    private final CourseTransactionRepository courseTransactionRepository;
    private final PaymentService paymentService;

    /**
     * Tạo URL thanh toán VNPay
     */
    public VNPayDTO.CreatePaymentResponse createPaymentUrl(
            VNPayDTO.CreatePaymentRequest request,
            HttpServletRequest httpRequest) {

        log.info("Creating VNPay payment URL for transaction: {} type: {}",
                request.getTransactionId(), request.getTransactionType());

        // Validate config
        if (vnPayConfig.getVnpTmnCode() == null || vnPayConfig.getVnpTmnCode().isEmpty()) {
            log.error("VNPay TmnCode is not configured!");
            return VNPayDTO.CreatePaymentResponse.builder()
                    .code("99")
                    .message("VNPay chưa được cấu hình. Vui lòng liên hệ Admin.")
                    .build();
        }

        try {
            // Số tiền phải nhân 100 (VNPay yêu cầu)
            long amount = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

            // Tạo mã giao dịch: TYPE_ID_RANDOM
            String vnpTxnRef = request.getTransactionType() + "_"
                    + request.getTransactionId() + "_"
                    + VNPayUtils.getRandomNumber(4);

            String vnpIpAddr = VNPayUtils.getIpAddress(httpRequest);

            // Build params
            Map<String, String> vnpParams = new HashMap<>();
            vnpParams.put("vnp_Version", vnPayConfig.getVnpVersion());
            vnpParams.put("vnp_Command", vnPayConfig.getVnpCommand());
            vnpParams.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
            vnpParams.put("vnp_Amount", String.valueOf(amount));
            vnpParams.put("vnp_CurrCode", "VND");

            if (request.getBankCode() != null && !request.getBankCode().isEmpty()) {
                vnpParams.put("vnp_BankCode", request.getBankCode());
            }

            vnpParams.put("vnp_TxnRef", vnpTxnRef);
            vnpParams.put("vnp_OrderInfo", request.getOrderInfo() != null
                    ? request.getOrderInfo()
                    : "Thanh toan don hang: " + vnpTxnRef);
            vnpParams.put("vnp_OrderType", vnPayConfig.getOrderType());

            String locale = request.getLanguage();
            vnpParams.put("vnp_Locale", (locale != null && !locale.isEmpty()) ? locale : "vn");

            vnpParams.put("vnp_ReturnUrl", vnPayConfig.getVnpReturnUrl());
            vnpParams.put("vnp_IpAddr", vnpIpAddr);

            // Thời gian tạo và hết hạn
            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnpCreateDate = formatter.format(cld.getTime());
            vnpParams.put("vnp_CreateDate", vnpCreateDate);

            cld.add(Calendar.MINUTE, 15);
            String vnpExpireDate = formatter.format(cld.getTime());
            vnpParams.put("vnp_ExpireDate", vnpExpireDate);

            // Build query URL với chữ ký
            String queryUrl = VNPayUtils.buildQueryUrl(vnpParams, vnPayConfig.getVnpHashSecret());
            String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl;

            log.info("Created VNPay URL for txnRef: {}", vnpTxnRef);

            return VNPayDTO.CreatePaymentResponse.builder()
                    .code("00")
                    .message("Success")
                    .paymentUrl(paymentUrl)
                    .transactionRef(vnpTxnRef)
                    .build();

        } catch (Exception e) {
            log.error("Error creating VNPay payment URL: {}", e.getMessage(), e);
            return VNPayDTO.CreatePaymentResponse.builder()
                    .code("99")
                    .message("Lỗi tạo URL thanh toán: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Xử lý callback từ VNPay (khi user được redirect về)
     * Trong môi trường sandbox, IPN không thể gọi localhost nên cũng xử lý confirm
     * ở đây
     */
    @Transactional
    public VNPayDTO.VNPayCallbackResponse processReturnUrl(Map<String, String> params) {
        log.info("Processing VNPay return with params: {}", params);

        String vnpSecureHash = params.get("vnp_SecureHash");

        // Validate chữ ký
        boolean isValid = VNPayUtils.validateSignature(params, vnpSecureHash, vnPayConfig.getVnpHashSecret());

        VNPayDTO.VNPayCallbackResponse response = VNPayDTO.VNPayCallbackResponse.builder()
                .vnpTxnRef(params.get("vnp_TxnRef"))
                .vnpAmount(params.get("vnp_Amount"))
                .vnpOrderInfo(params.get("vnp_OrderInfo"))
                .vnpResponseCode(params.get("vnp_ResponseCode"))
                .vnpTransactionNo(params.get("vnp_TransactionNo"))
                .vnpBankCode(params.get("vnp_BankCode"))
                .vnpPayDate(params.get("vnp_PayDate"))
                .vnpTransactionStatus(params.get("vnp_TransactionStatus"))
                .valid(isValid)
                .build();

        if (!isValid) {
            response.setMessage("Chữ ký không hợp lệ!");
            log.warn("Invalid signature for txnRef: {}", params.get("vnp_TxnRef"));
            return response;
        }

        String transactionStatus = params.get("vnp_TransactionStatus");
        String vnpTxnRef = params.get("vnp_TxnRef");

        if ("00".equals(transactionStatus)) {
            response.setMessage("Giao dịch thành công!");

            // Trong môi trường sandbox, IPN không thể gọi localhost
            // Nên cũng xử lý confirm giao dịch ở đây
            try {
                confirmTransactionFromTxnRef(vnpTxnRef);
            } catch (Exception e) {
                log.error("Error confirming transaction from return URL: {}", e.getMessage());
                // Vẫn trả về success cho user, transaction có thể đã được confirm từ IPN
            }
        } else {
            response.setMessage("Giao dịch không thành công. Mã lỗi: " + transactionStatus);
        }

        return response;
    }

    /**
     * Xác nhận giao dịch từ txnRef
     * Được gọi từ cả Return URL và IPN
     */
    private void confirmTransactionFromTxnRef(String vnpTxnRef) {
        String[] parts = vnpTxnRef.split("_");
        if (parts.length < 2) {
            log.error("Invalid txnRef format: {}", vnpTxnRef);
            return;
        }

        String type = parts[0];
        Long transactionId = Long.parseLong(parts[1]);

        if ("SLOT".equals(type)) {
            Optional<SlotTransaction> optTx = slotTransactionRepository.findById(transactionId);
            if (optTx.isPresent() && !"COMPLETED".equals(optTx.get().getPaymentStatus())) {
                paymentService.confirmSlotPayment(transactionId);
                log.info("Confirmed SLOT payment from return URL for ID: {}", transactionId);
            }
        } else if ("COURSE".equals(type)) {
            Optional<CourseTransaction> optTx = courseTransactionRepository.findById(transactionId);
            if (optTx.isPresent() && !"COMPLETED".equals(optTx.get().getPaymentStatus())) {
                paymentService.confirmCoursePayment(transactionId);
                log.info("Confirmed COURSE payment from return URL for ID: {}", transactionId);
            }
        }
    }

    /**
     * Xử lý IPN (Instant Payment Notification) từ VNPay server
     * Đây là nơi thực sự cập nhật trạng thái giao dịch
     */
    @Transactional
    public VNPayDTO.IPNResponse processIPN(Map<String, String> params) {
        log.info("Processing VNPay IPN: {}", params);

        String vnpSecureHash = params.get("vnp_SecureHash");
        String vnpTxnRef = params.get("vnp_TxnRef");
        String vnpTransactionStatus = params.get("vnp_TransactionStatus");

        // 1. Validate chữ ký
        boolean isValid = VNPayUtils.validateSignature(params, vnpSecureHash, vnPayConfig.getVnpHashSecret());
        if (!isValid) {
            log.error("Invalid IPN signature for txnRef: {}", vnpTxnRef);
            return VNPayDTO.IPNResponse.builder()
                    .RspCode("97")
                    .Message("Invalid Checksum")
                    .build();
        }

        // 2. Parse txnRef để lấy loại giao dịch và ID
        // Format: TYPE_ID_RANDOM (ví dụ: SLOT_123_4567)
        try {
            String[] parts = vnpTxnRef.split("_");
            if (parts.length < 2) {
                log.error("Invalid txnRef format: {}", vnpTxnRef);
                return VNPayDTO.IPNResponse.builder()
                        .RspCode("01")
                        .Message("Order not found")
                        .build();
            }

            String type = parts[0];
            Long transactionId = Long.parseLong(parts[1]);

            // 3. Kiểm tra giao dịch tồn tại
            if ("SLOT".equals(type)) {
                Optional<SlotTransaction> optTx = slotTransactionRepository.findById(transactionId);
                if (optTx.isEmpty()) {
                    return VNPayDTO.IPNResponse.builder()
                            .RspCode("01")
                            .Message("Order not found")
                            .build();
                }

                SlotTransaction tx = optTx.get();

                // Kiểm tra đã thanh toán chưa
                if ("COMPLETED".equals(tx.getPaymentStatus())) {
                    return VNPayDTO.IPNResponse.builder()
                            .RspCode("02")
                            .Message("Order already confirmed")
                            .build();
                }

                // 4. Cập nhật trạng thái nếu thanh toán thành công
                if ("00".equals(vnpTransactionStatus)) {
                    paymentService.confirmSlotPayment(transactionId);
                    log.info("Successfully confirmed SLOT payment for ID: {}", transactionId);
                }

            } else if ("COURSE".equals(type)) {
                Optional<CourseTransaction> optTx = courseTransactionRepository.findById(transactionId);
                if (optTx.isEmpty()) {
                    return VNPayDTO.IPNResponse.builder()
                            .RspCode("01")
                            .Message("Order not found")
                            .build();
                }

                CourseTransaction tx = optTx.get();

                if ("COMPLETED".equals(tx.getPaymentStatus())) {
                    return VNPayDTO.IPNResponse.builder()
                            .RspCode("02")
                            .Message("Order already confirmed")
                            .build();
                }

                if ("00".equals(vnpTransactionStatus)) {
                    paymentService.confirmCoursePayment(transactionId);
                    log.info("Successfully confirmed COURSE payment for ID: {}", transactionId);
                }
            }

            return VNPayDTO.IPNResponse.builder()
                    .RspCode("00")
                    .Message("Confirm Success")
                    .build();

        } catch (Exception e) {
            log.error("Error processing IPN: {}", e.getMessage(), e);
            return VNPayDTO.IPNResponse.builder()
                    .RspCode("99")
                    .Message("Unknown error")
                    .build();
        }
    }
}
