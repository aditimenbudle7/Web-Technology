package com.cricket.web;

import com.cricket.service.ApiException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Returns errors as JSON: { "error": "message" } */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> api(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> badRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid request"));
    }
}
