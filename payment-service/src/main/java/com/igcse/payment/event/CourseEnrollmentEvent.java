package com.igcse.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentEvent {
    private Long studentId;
    private Long courseId;
    private Long transactionId;
    private LocalDateTime timestamp;
}
