package com.igcse.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.igcse.auth.exception.GlobalExceptionHandler;
import com.igcse.auth.service.AuthService;

@ExtendWith(MockitoExtension.class)
class AuthControllerValidationTest {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void forgotPasswordMissingEmailShouldReturnBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("email"))
                .andExpect(jsonPath("$.message").value("email is required"));

        verifyNoInteractions(authService);
    }

    @Test
    void changePasswordEmptyNewPasswordShouldReturnBadRequest() throws Exception {
        String requestBody = """
                {
                  "oldPassword": "abc321",
                  "newPassword": "",
                  "confirmPassword": ""
                }
                """;

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(authService);
    }

    @Test
    void changePasswordValidPayloadShouldReturnOk() throws Exception {
        String requestBody = """
                {
                  "oldPassword": "abc321",
                  "newPassword": "abc123456",
                  "confirmPassword": "abc123456"
                }
                """;

        when(authService.changePassword(any())).thenReturn("Doi mat khau thanh cong!");

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }
}
