package com.college.result.dto;

import java.util.List;

public record ClassSummary(
    int students,
    int passed,
    int failed,
    double passPercentage,
    double averageSgpa,
    String topperName,
    String topperRollNo,
    double topperSgpa,
    List<SubjectAverage> subjects) {
}
