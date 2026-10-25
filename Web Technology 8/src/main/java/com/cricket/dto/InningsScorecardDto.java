package com.cricket.dto;

import java.util.List;

public record InningsScorecardDto(
    TeamDto battingTeam,
    TeamDto bowlingTeam,
    int runs,
    int wickets,
    String overs,
    double runRate,
    Integer target,
    int extras,
    String extrasDetail,
    List<BatterDto> batters,
    List<String> yetToBat,
    List<BowlerDto> bowlers,
    List<String> fallOfWickets,
    List<Integer> runsPerOver,
    boolean complete) {
}
