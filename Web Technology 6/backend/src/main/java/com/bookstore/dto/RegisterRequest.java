package com.bookstore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, message = "Name must be at least 3 characters") String fullName,
        @NotBlank @Email(message = "Enter a valid email address") String email,
        @Pattern(regexp = "^$|^\\d{10}$", message = "Phone must be 10 digits") String phone,
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password) {}
