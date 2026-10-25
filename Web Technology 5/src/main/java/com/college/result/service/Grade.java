package com.college.result.service;

/** 10-point grading scale. */
public enum Grade {
    O("O", 90, 10, "Outstanding"),
    A_PLUS("A+", 80, 9, "Excellent"),
    A("A", 70, 8, "Very Good"),
    B_PLUS("B+", 60, 7, "Good"),
    B("B", 50, 6, "Above Average"),
    C("C", 45, 5, "Average"),
    P("P", 40, 4, "Pass"),
    F("F", 0, 0, "Fail");

    private final String label;
    private final double minMarks;
    private final int points;
    private final String remark;

    Grade(String label, double minMarks, int points, String remark) {
        this.label = label;
        this.minMarks = minMarks;
        this.points = points;
        this.remark = remark;
    }

    public static Grade of(double finalMarks) {
        for (Grade g : values()) {
            if (finalMarks >= g.minMarks) return g;
        }
        return F;
    }

    public String getLabel() { return label; }
    public double getMinMarks() { return minMarks; }
    public int getPoints() { return points; }
    public String getRemark() { return remark; }
    public boolean isPass() { return this != F; }
}
