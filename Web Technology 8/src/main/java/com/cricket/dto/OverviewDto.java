package com.cricket.dto;

public record OverviewDto(
    int live,
    int upcoming,
    int completed,
    int totalRuns,
    int totalWickets,
    int fours,
    int sixes,
    long ballsSimulated,
    int connectedViewers) {
}
