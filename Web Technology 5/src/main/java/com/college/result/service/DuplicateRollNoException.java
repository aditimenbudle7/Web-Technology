package com.college.result.service;

public class DuplicateRollNoException extends RuntimeException {
    public DuplicateRollNoException(String rollNo) {
        super("A result for roll number " + rollNo + " already exists");
    }
}
