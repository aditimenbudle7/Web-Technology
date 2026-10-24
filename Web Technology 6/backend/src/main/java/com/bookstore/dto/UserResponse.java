package com.bookstore.dto;

import com.bookstore.model.User;

/** The user data sent to the frontend (never includes the password hash). */
public record UserResponse(String id, String fullName, String email, String phone) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhone());
    }
}
