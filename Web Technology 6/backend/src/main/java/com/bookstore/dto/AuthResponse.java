package com.bookstore.dto;

public record AuthResponse(UserResponse user, String token) {}
