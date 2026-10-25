package com.cricket.model;

public class BowlerFigure {
    private final String name;
    private int legalBalls;
    private int runs;
    private int wickets;
    private int maidens;
    private int runsThisOver;

    public BowlerFigure(String name) {
        this.name = name;
    }

    public void startOver() {
        runsThisOver = 0;
    }

    public void legalBall() {
        legalBalls++;
    }

    public void concede(int r) {
        runs += r;
        runsThisOver += r;
    }

    public void takeWicket() {
        wickets++;
    }

    /** Called at the end of a completed over. */
    public void finishOver() {
        if (runsThisOver == 0) maidens++;
    }

    public int completedOvers() {
        return legalBalls / 6;
    }

    public String oversText() {
        return legalBalls / 6 + (legalBalls % 6 == 0 ? "" : "." + legalBalls % 6);
    }

    public double economy() {
        return legalBalls == 0 ? 0 : runs * 6.0 / legalBalls;
    }

    public String getName() { return name; }
    public int getLegalBalls() { return legalBalls; }
    public int getRuns() { return runs; }
    public int getWickets() { return wickets; }
    public int getMaidens() { return maidens; }
}
