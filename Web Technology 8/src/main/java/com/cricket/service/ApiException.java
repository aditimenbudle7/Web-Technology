package com.cricket.service;

/** Error with an HTTP status code, turned into a JSON error response by the web layer. */
public class ApiException extends RuntimeException {
    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }

    public static ApiException notFound(String what) {
        return new ApiException(404, what + " not found");
    }
}
