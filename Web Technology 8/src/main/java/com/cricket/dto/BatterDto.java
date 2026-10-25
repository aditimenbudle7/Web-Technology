package com.cricket.dto;

public record BatterDto(
    String name, int runs, int balls, int fours, int sixes, double strikeRate,
    String status, boolean out, boolean onStrike, boolean atCrease) {
}
