package com.igcse.ai.exception;

public class InvalidLanguageException extends AIServiceException {
    public InvalidLanguageException(String language) {
        super(
            String.format("Invalid language: %s. Supported: en, vi", language),
            "INVALID_LANGUAGE",
            "Language: " + language
        );
    }
}

