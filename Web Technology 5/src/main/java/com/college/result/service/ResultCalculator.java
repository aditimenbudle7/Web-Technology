package com.college.result.service;

import java.util.List;

/**
 * Result rules (pure Java, no framework code so it is easy to unit test).
 *
 *   Final marks (out of 100) = 30% of MSE (out of 100) + 70% of ESE (out of 100)
 *   A subject is passed when the final marks are at least 40.
 *   SGPA = sum(credits x grade points) / sum(credits)
 *   The semester is PASS only if every subject is passed.
 */
public final class ResultCalculator {

    public static final double MSE_WEIGHT = 0.30;
    public static final double ESE_WEIGHT = 0.70;
    public static final int MAX_MARKS = 100;
    public static final double PASS_MARKS = 40;

    private ResultCalculator() {
    }

    public static double mseContribution(int mse) {
        return round2(check(mse, "MSE") * MSE_WEIGHT);
    }

    public static double eseContribution(int ese) {
        return round2(check(ese, "ESE") * ESE_WEIGHT);
    }

    public static double finalMarks(int mse, int ese) {
        return round2(check(mse, "MSE") * MSE_WEIGHT + check(ese, "ESE") * ESE_WEIGHT);
    }

    /** @param subjects pairs of (credits, grade points) */
    public static double sgpa(List<int[]> subjects) {
        int credits = 0;
        int weighted = 0;
        for (int[] s : subjects) {
            credits += s[0];
            weighted += s[0] * s[1];
        }
        return credits == 0 ? 0 : round2((double) weighted / credits);
    }

    public static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static int check(int marks, String what) {
        if (marks < 0 || marks > MAX_MARKS) {
            throw new IllegalArgumentException(what + " marks must be between 0 and " + MAX_MARKS);
        }
        return marks;
    }
}
