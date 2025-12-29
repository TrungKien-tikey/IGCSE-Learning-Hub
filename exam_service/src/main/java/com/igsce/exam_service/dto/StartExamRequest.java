package com.igsce.exam_service.dto;

import lombok.*;
import java.util.*;

@Data
public class StartExamRequest {
    private Long examId;
    private Long userId;
}
