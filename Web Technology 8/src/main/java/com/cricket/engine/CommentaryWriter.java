package com.cricket.engine;

import java.util.Random;

/** Generates varied, human-sounding ball-by-ball commentary. */
public class CommentaryWriter {

    private static final String[] DOT = {
        "no run, defended solidly back to the bowler",
        "beaten! Lovely delivery that just shaved the outside edge",
        "no run, pushed straight to cover",
        "dot ball, good length and left alone outside off",
        "no run, tucked to midwicket where the fielder is alert",
    };
    private static final String[] ONE = {
        "1 run, worked off the pads to fine leg",
        "1 run, dabbed to third man for a quick single",
        "1 run, driven down to long-on",
        "1 run, nudged into the gap at point",
    };
    private static final String[] TWO = {
        "2 runs, placed into the deep and they hustle back for the second",
        "2 runs, clipped behind square, good running between the wickets",
    };
    private static final String[] THREE = {
        "3 runs, chased down just inside the rope",
    };
    private static final String[] FOUR = {
        "FOUR! Cracking cover drive, raced away to the boundary",
        "FOUR! Short and punished, pulled hard through midwicket",
        "FOUR! Edged, but it flies past the slip cordon",
        "FOUR! Glorious straight drive past the bowler",
        "FOUR! Late cut, beautifully placed past backward point",
    };
    private static final String[] SIX = {
        "SIX! Launched high over long-on, into the stands",
        "SIX! Picked up off the pads and dispatched over fine leg",
        "SIX! Stepped out and lofted it straight back over the sightscreen",
        "SIX! Massive hit over deep midwicket",
    };

    private final Random random;

    public CommentaryWriter(Random random) {
        this.random = random;
    }

    private String last = "";

    /** Picks a phrase, avoiding the same line twice in a row. */
    private String pick(String[] options) {
        String p = options[random.nextInt(options.length)];
        if (p.equals(last) && options.length > 1) p = options[(java.util.Arrays.asList(options).indexOf(p) + 1) % options.length];
        last = p;
        return p;
    }

    public String runs(String bowler, String batter, int runs) {
        String phrase = switch (runs) {
            case 0 -> pick(DOT);
            case 1 -> pick(ONE);
            case 2 -> pick(TWO);
            case 3 -> pick(THREE);
            case 4 -> pick(FOUR);
            case 6 -> pick(SIX);
            default -> runs + " runs";
        };
        return bowler + " to " + batter + ", " + phrase + ".";
    }

    public String wicket(String bowler, String batter, String dismissal, int runs, int balls) {
        return bowler + " to " + batter + ", OUT! " + batter + " " + dismissal + " " + runs + " (" + balls + ").";
    }

    public String wide(String bowler, String batter, int total) {
        return bowler + " to " + batter + ", wide" + (total > 1 ? ", and it runs away for " + total : "")
            + " - strayed down the leg side.";
    }

    public String noBall(String bowler, String batter, int runsOffBat) {
        return bowler + " to " + batter + ", NO BALL! Overstepped"
            + (runsOffBat > 0 ? " and " + runsOffBat + " off the bat as well" : "") + ".";
    }
}
