package com.igsce.exam_service.dto;

import lombok.Data;
import java.util.*;

@Data
public class SubmitExamRequest {
    private Long attemptId;
    private List<StudentAnswerDTO> answers;
}
