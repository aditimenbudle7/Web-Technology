package com.college.result.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class ResultCalculatorTest {

    @Test
    void finalMarksUses30PercentMseAnd70PercentEse() {
        assertEquals(75.8, ResultCalculator.finalMarks(80, 74)); // 24.0 + 51.8
    }

    @Test
    void contributionsAreWeighted() {
        assertEquals(24.0, ResultCalculator.mseContribution(80));
        assertEquals(51.8, ResultCalculator.eseContribution(74));
        assertEquals(100.0, ResultCalculator.finalMarks(100, 100));
        assertEquals(0.0, ResultCalculator.finalMarks(0, 0));
    }

    @Test
    void gradesFollowTenPointScale() {
        assertEquals(Grade.O, Grade.of(90));
        assertEquals(Grade.A_PLUS, Grade.of(89.99));
        assertEquals(Grade.P, Grade.of(40));
        assertEquals(Grade.F, Grade.of(39.99));
        assertTrue(Grade.P.isPass());
        assertFalse(Grade.F.isPass());
    }

    @Test
    void sgpaIsCreditWeighted() {
        // (4 x 10 + 4 x 8 + 3 x 7 + 3 x 6) / 14 = 111 / 14 = 7.93
        double sgpa = ResultCalculator.sgpa(List.of(new int[] {4, 10}, new int[] {4, 8}, new int[] {3, 7}, new int[] {3, 6}));
        assertEquals(7.93, sgpa);
    }

    @Test
    void rejectsMarksOutOfRange() {
        assertThrows(IllegalArgumentException.class, () -> ResultCalculator.finalMarks(101, 50));
        assertThrows(IllegalArgumentException.class, () -> ResultCalculator.finalMarks(50, -1));
    }
}
