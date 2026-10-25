package com.cricket.model;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Optional;

public class Innings {
    private static final int RECENT_BALLS = 12;

    private final Team battingTeam;
    private final Team bowlingTeam;
    private final int maxBalls;
    private final Integer target; // null in the first innings

    private int runs;
    private int wickets;
    private int legalBalls;
    private int wides;
    private int noBalls;

    private final List<BatterScore> batters = new ArrayList<>();
    private int strikerIdx = -1;
    private int nonStrikerIdx = -1;
    private int nextBatter = 0;

    private final List<BowlerFigure> bowlers = new ArrayList<>();
    private BowlerFigure currentBowler;
    private String previousOverBowler;

    private final List<Integer> runsPerOver = new ArrayList<>();
    private int runsThisOver;
    private final List<String> thisOver = new ArrayList<>();
    private final Deque<String> recentBalls = new ArrayDeque<>();
    private final List<String> fallOfWickets = new ArrayList<>();

    private int partnershipRuns;
    private int partnershipBalls;
    private boolean complete;

    public Innings(Team battingTeam, Team bowlingTeam, int overs, Integer target) {
        this.battingTeam = battingTeam;
        this.bowlingTeam = bowlingTeam;
        this.maxBalls = overs * 6;
        this.target = target;
    }

    public void openBatters() {
        strikerIdx = addNextBatter();
        nonStrikerIdx = addNextBatter();
    }

    private int addNextBatter() {
        batters.add(new BatterScore(battingTeam.players().get(nextBatter++)));
        return batters.size() - 1;
    }

    /** The next batter walks in at the striker's end. */
    public BatterScore newBatterAtStrike() {
        strikerIdx = addNextBatter();
        return batters.get(strikerIdx);
    }

    public BatterScore striker() { return batters.get(strikerIdx); }
    public BatterScore nonStriker() { return batters.get(nonStrikerIdx); }

    public void swapStrike() {
        int t = strikerIdx;
        strikerIdx = nonStrikerIdx;
        nonStrikerIdx = t;
    }

    public BowlerFigure bowlerFigure(String name) {
        Optional<BowlerFigure> existing = bowlers.stream().filter(b -> b.getName().equals(name)).findFirst();
        if (existing.isPresent()) return existing.get();
        BowlerFigure b = new BowlerFigure(name);
        bowlers.add(b);
        return b;
    }

    public int oversBowledBy(String name) {
        return bowlers.stream().filter(b -> b.getName().equals(name)).mapToInt(BowlerFigure::completedOvers).sum();
    }

    // ---- scoring ----
    public void addRuns(int r) { runs += r; }
    public void legalBall() { legalBalls++; }
    public void addWide(int total) { runs += total; wides += total; }
    public void addNoBall(int total) { runs += total; noBalls++; }

    public void recordBall(int total, String symbol) {
        runsThisOver += total;
        thisOver.add(symbol);
        recentBalls.addLast(symbol);
        while (recentBalls.size() > RECENT_BALLS) recentBalls.removeFirst();
    }

    public void addPartnership(int r, int balls) {
        partnershipRuns += r;
        partnershipBalls += balls;
    }

    public void wicketFell(BatterScore out, String overLabel) {
        wickets++;
        fallOfWickets.add(runs + "-" + wickets + " (" + out.getName() + ", " + overLabel + " ov)");
        partnershipRuns = 0;
        partnershipBalls = 0;
    }

    /** Records the runs of the over that just ended (or the part of it bowled). */
    public void closeOver() {
        if (!thisOver.isEmpty()) runsPerOver.add(runsThisOver);
        runsThisOver = 0;
        thisOver.clear();
    }

    public void markComplete() { complete = true; }

    // ---- derived values ----
    public String oversText() {
        return legalBalls / 6 + (legalBalls % 6 == 0 ? "" : "." + legalBalls % 6);
    }

    /** Label of the delivery about to be bowled, e.g. "14.3". */
    public String nextBallLabel() {
        return legalBalls / 6 + "." + (legalBalls % 6 + 1);
    }

    public int remainingBalls() { return Math.max(0, maxBalls - legalBalls); }
    public double runRate() { return legalBalls == 0 ? 0 : runs * 6.0 / legalBalls; }
    public int runsNeeded() { return target == null ? 0 : Math.max(0, target - runs); }
    public double requiredRate() {
        int rem = remainingBalls();
        return target == null || rem == 0 ? 0 : runsNeeded() * 6.0 / rem;
    }

    public List<String> yetToBat() {
        return battingTeam.players().subList(nextBatter, battingTeam.players().size());
    }

    // ---- getters ----
    public Team getBattingTeam() { return battingTeam; }
    public Team getBowlingTeam() { return bowlingTeam; }
    public int getMaxBalls() { return maxBalls; }
    public Integer getTarget() { return target; }
    public int getRuns() { return runs; }
    public int getWickets() { return wickets; }
    public int getLegalBalls() { return legalBalls; }
    public int getWides() { return wides; }
    public int getNoBalls() { return noBalls; }
    public List<BatterScore> getBatters() { return Collections.unmodifiableList(batters); }
    public int getStrikerIdx() { return strikerIdx; }
    public int getNonStrikerIdx() { return nonStrikerIdx; }
    public List<BowlerFigure> getBowlers() { return Collections.unmodifiableList(bowlers); }
    public BowlerFigure getCurrentBowler() { return currentBowler; }
    public void setCurrentBowler(BowlerFigure b) { currentBowler = b; }
    public String getPreviousOverBowler() { return previousOverBowler; }
    public void setPreviousOverBowler(String n) { previousOverBowler = n; }
    public List<Integer> getRunsPerOver() { return Collections.unmodifiableList(runsPerOver); }
    public int getRunsThisOver() { return runsThisOver; }
    public List<String> getThisOver() { return Collections.unmodifiableList(thisOver); }
    public List<String> getRecentBalls() { return new ArrayList<>(recentBalls); }
    public List<String> getFallOfWickets() { return Collections.unmodifiableList(fallOfWickets); }
    public int getPartnershipRuns() { return partnershipRuns; }
    public int getPartnershipBalls() { return partnershipBalls; }
    public boolean isComplete() { return complete; }
}
