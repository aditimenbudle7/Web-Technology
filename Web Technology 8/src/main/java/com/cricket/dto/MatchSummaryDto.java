package com.cricket.dto;

import java.util.List;

/** Compact live view of a match, used for dashboard cards and live push updates. */
public record MatchSummaryDto(
    String id,
    String series,
    String format,
    int oversPerSide,
    String venue,
    String status,
    TeamDto teamA,
    TeamDto teamB,
    List<InningsSummaryDto> innings,
    String battingTeam,
    String statusText,
    Double currentRunRate,
    Double requiredRunRate,
    Integer target,
    List<String> recentBalls,
    String startsAt,
    boolean paused,
    String result,
    String winner,
    String updatedAt) {
}
