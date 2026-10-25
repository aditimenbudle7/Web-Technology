package com.cricket.model;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;

/**
 * A cricket match. All mutation happens while holding the match's monitor
 * (synchronized (match)), so ball updates and API reads never interleave.
 */
public class Match {
    public static final int MAX_COMMENTARY = 300;

    private final String id;
    private final String series;
    private final String venue;
    private final MatchFormat format;
    private final Team teamA;
    private final Team teamB;

    private MatchStatus status = MatchStatus.UPCOMING;
    private Instant startsAt;
    private Instant updatedAt = Instant.now();
    private final List<Innings> innings = new ArrayList<>();
    private final Deque<Commentary> commentary = new ArrayDeque<>();
    private String tossText;
    private String result;
    private String winnerShortName;
    private String playerOfMatch;
    private boolean paused;
    private long ballsBowled;

    public Match(String id, String series, String venue, MatchFormat format, Team teamA, Team teamB, Instant startsAt) {
        this.id = id;
        this.series = series;
        this.venue = venue;
        this.format = format;
        this.teamA = teamA;
        this.teamB = teamB;
        this.startsAt = startsAt;
    }

    public Innings currentInnings() {
        return innings.isEmpty() ? null : innings.get(innings.size() - 1);
    }

    public void addInnings(Innings i) {
        innings.add(i);
    }

    public void addCommentary(String over, String text, CommentaryType type) {
        commentary.addFirst(new Commentary(over, text, type, Instant.now()));
        while (commentary.size() > MAX_COMMENTARY) commentary.removeLast();
        touch();
    }

    public List<Commentary> latestCommentary(int limit) {
        return commentary.stream().limit(limit).toList();
    }

    public Team other(Team t) {
        return t == teamA ? teamB : teamA;
    }

    public void touch() { updatedAt = Instant.now(); }
    public void incrementBalls() { ballsBowled++; }

    public String getId() { return id; }
    public String getSeries() { return series; }
    public String getVenue() { return venue; }
    public MatchFormat getFormat() { return format; }
    public Team getTeamA() { return teamA; }
    public Team getTeamB() { return teamB; }
    public MatchStatus getStatus() { return status; }
    public void setStatus(MatchStatus s) { status = s; touch(); }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant t) { startsAt = t; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<Innings> getInnings() { return Collections.unmodifiableList(innings); }
    public String getTossText() { return tossText; }
    public void setTossText(String t) { tossText = t; }
    public String getResult() { return result; }
    public void setResult(String r) { result = r; }
    public String getWinnerShortName() { return winnerShortName; }
    public void setWinnerShortName(String w) { winnerShortName = w; }
    public String getPlayerOfMatch() { return playerOfMatch; }
    public void setPlayerOfMatch(String p) { playerOfMatch = p; }
    public boolean isPaused() { return paused; }
    public void setPaused(boolean p) { paused = p; touch(); }
    public long getBallsBowled() { return ballsBowled; }
}
