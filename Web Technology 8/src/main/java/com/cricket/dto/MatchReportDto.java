package com.cricket.dto;

import java.util.List;

public record MatchReportDto(
    String result,
    String toss,
    String playerOfMatch,
    int totalRuns,
    int totalWickets,
    int fours,
    int sixes,
    int extras,
    List<PerformerDto> topBatters,
    List<PerformerDto> topBowlers) {
}
