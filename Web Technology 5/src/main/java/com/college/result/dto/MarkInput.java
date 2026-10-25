package com.college.result.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Marks entered for one subject (both out of 100). */
public class MarkInput {

    @NotNull
    private Long subjectId;

    private String subjectCode;
    private String subjectName;
    private Integer credits;

    @NotNull(message = "Enter MSE marks")
    @Min(value = 0, message = "MSE must be 0 - 100")
    @Max(value = 100, message = "MSE must be 0 - 100")
    private Integer mse;

    @NotNull(message = "Enter ESE marks")
    @Min(value = 0, message = "ESE must be 0 - 100")
    @Max(value = 100, message = "ESE must be 0 - 100")
    private Integer ese;

    public MarkInput() {
    }

    public MarkInput(Long subjectId, String subjectCode, String subjectName, Integer credits, Integer mse, Integer ese) {
        this.subjectId = subjectId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.credits = credits;
        this.mse = mse;
        this.ese = ese;
    }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
    public Integer getMse() { return mse; }
    public void setMse(Integer mse) { this.mse = mse; }
    public Integer getEse() { return ese; }
    public void setEse(Integer ese) { this.ese = ese; }
}
