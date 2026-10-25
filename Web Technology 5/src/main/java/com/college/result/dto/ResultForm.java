package com.college.result.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

/** Data entered on the "Add / Edit result" page (also used as the JSON body of the REST API). */
public class ResultForm {

    @NotBlank(message = "Roll number is required")
    @Size(max = 20, message = "Roll number can have at most 20 characters")
    @Pattern(regexp = "^[A-Za-z0-9/-]+$", message = "Use only letters, digits, '-' or '/'")
    private String rollNo;

    @NotBlank(message = "Name is required")
    @Size(max = 80, message = "Name can have at most 80 characters")
    private String name;

    @NotBlank(message = "Department is required")
    @Size(max = 60)
    private String department;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be 1 - 8")
    @Max(value = 8, message = "Semester must be 1 - 8")
    private Integer semester;

    @NotBlank(message = "Academic year is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Use the format 2025-26")
    private String academicYear;

    @Valid
    @Size(min = 4, max = 4, message = "Marks for all four subjects are required")
    private List<MarkInput> marks = new ArrayList<>();

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public List<MarkInput> getMarks() { return marks; }
    public void setMarks(List<MarkInput> marks) { this.marks = marks; }
}
