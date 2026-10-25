package com.cricket.model;

public enum MatchFormat {
    T10(10), T20(20), ODI(50);

    private final int overs;

    MatchFormat(int overs) {
        this.overs = overs;
    }

    public int getOvers() {
        return overs;
    }

    /** Maximum overs a single bowler may bowl (one fifth of the innings). */
    public int maxOversPerBowler() {
        return overs / 5;
    }
}
