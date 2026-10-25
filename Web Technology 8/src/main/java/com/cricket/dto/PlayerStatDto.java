package com.cricket.dto;

public record PlayerStatDto(
    String name,
    String team,
    String teamColor,
    int matches,
    int innings,
    int runs,
    int balls,
    int highScore,
    boolean highScoreNotOut,
    int fours,
    int sixes,
    double strikeRate,
    int wickets,
    String overs,
    int runsConceded,
    double economy,
    String bestBowling) {
}
