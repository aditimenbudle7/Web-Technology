package com.college.result.dto;

public record SubjectResult(
    String code,
    String name,
    int credits,
    int mse,
    double mseWeighted,
    int ese,
    double eseWeighted,
    double finalMarks,
    String grade,
    int gradePoints,
    boolean passed) {
}
