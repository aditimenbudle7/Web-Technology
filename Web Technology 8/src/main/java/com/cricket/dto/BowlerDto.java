package com.cricket.dto;

public record BowlerDto(
    String name, String overs, int maidens, int runs, int wickets, double economy, boolean bowling) {
}
