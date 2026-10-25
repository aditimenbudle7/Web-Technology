package com.cricket.model;

public class BatterScore {
    private final String name;
    private int runs;
    private int balls;
    private int fours;
    private int sixes;
    private boolean out;
    private String dismissal;

    public BatterScore(String name) {
        this.name = name;
    }

    /** A ball faced by this batter (legal ball or no-ball) with runs off the bat. */
    public void faceBall(int runsOffBat) {
        balls++;
        runs += runsOffBat;
        if (runsOffBat == 4) fours++;
        if (runsOffBat == 6) sixes++;
    }

    public void dismiss(String how) {
        out = true;
        dismissal = how;
    }

    public double strikeRate() {
        return balls == 0 ? 0 : runs * 100.0 / balls;
    }

    public String getName() { return name; }
    public int getRuns() { return runs; }
    public int getBalls() { return balls; }
    public int getFours() { return fours; }
    public int getSixes() { return sixes; }
    public boolean isOut() { return out; }
    public String getDismissal() { return dismissal; }
}
