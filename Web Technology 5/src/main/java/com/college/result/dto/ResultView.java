package com.college.result.dto;

import java.util.List;

/** A student's complete semester result (the marksheet). */
public record ResultView(
    Long id,
    String rollNo,
    String name,
    String department,
    int semester,
    String academicYear,
    List<SubjectResult> subjects,
    double grandTotal,
    int maxTotal,
    double percentage,
    int totalCredits,
    int earnedCredits,
    double sgpa,
    boolean passed,
    int failedSubjects) {

    public String getResult() {
        return passed ? "PASS" : "FAIL";
    }
}
