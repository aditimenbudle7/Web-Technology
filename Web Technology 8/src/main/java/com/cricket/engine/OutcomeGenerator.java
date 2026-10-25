package com.cricket.engine;

import com.cricket.model.Extra;
import com.cricket.model.Innings;
import com.cricket.model.MatchFormat;
import java.util.Random;

/** Produces realistic random deliveries depending on format, phase and match situation. */
public class OutcomeGenerator {

    // index:              dot    1     2     3     4     6     W      wide   no-ball
    private static final double[] BASE = {0.35, 0.35, 0.08, 0.01, 0.10, 0.038, 0.045, 0.03, 0.01};
    private static final int DOT = 0, ONE = 1, TWO = 2, FOUR = 4, SIX = 5, WICKET = 6, WIDE = 7, NO_BALL = 8;

    private static final String[] DISMISSALS = {"caught", "bowled", "lbw", "run out", "stumped"};
    private static final double[] DISMISSAL_WEIGHTS = {0.56, 0.2, 0.13, 0.07, 0.04};

    private final Random random;

    public OutcomeGenerator(Random random) {
        this.random = random;
    }

    public BallOutcome next(MatchFormat format, Innings inn) {
        double[] w = BASE.clone();

        switch (format) {
            case ODI -> { w[DOT] *= 1.35; w[FOUR] *= 0.75; w[SIX] *= 0.45; w[WICKET] *= 0.75; }
            case T10 -> { w[DOT] *= 0.85; w[FOUR] *= 1.3; w[SIX] *= 1.6; w[WICKET] *= 1.2; }
            default -> { }
        }

        double progress = inn.getLegalBalls() / (double) inn.getMaxBalls();
        if (progress < 0.3) {            // powerplay
            w[FOUR] *= 1.2; w[WICKET] *= 0.9;
        } else if (progress > 0.8) {     // death overs
            w[DOT] *= 0.85; w[ONE] *= 0.9; w[FOUR] *= 1.2; w[SIX] *= 1.6; w[WICKET] *= 1.4;
        }

        if (inn.getTarget() != null && inn.remainingBalls() > 0) {
            double rrr = inn.requiredRate();
            double crr = inn.getLegalBalls() < 6 ? rrr : inn.runRate();
            if (rrr > 12) { w[SIX] *= 1.6; w[FOUR] *= 1.2; w[WICKET] *= 1.5; }
            else if (rrr > crr + 2) { w[SIX] *= 1.3; w[WICKET] *= 1.2; }
            else if (rrr < 6) { w[DOT] *= 1.2; w[SIX] *= 0.7; w[WICKET] *= 0.7; }
        }

        if (inn.getWickets() >= 7) {     // tail-enders
            w[WICKET] *= 1.4; w[FOUR] *= 0.8; w[SIX] *= 0.8;
        }

        int pick = weighted(w);
        return switch (pick) {
            case WICKET -> new BallOutcome(0, Extra.NONE, true, dismissal());
            case WIDE -> new BallOutcome(random.nextDouble() < 0.04 ? 4 : 0, Extra.WIDE, false, null);
            case NO_BALL -> {
                double r = random.nextDouble();
                int bat = r < 0.5 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 4 : 6;
                yield new BallOutcome(bat, Extra.NO_BALL, false, null);
            }
            case FOUR -> BallOutcome.runs(4);
            case SIX -> BallOutcome.runs(6);
            default -> BallOutcome.runs(pick); // 0, 1, 2, 3
        };
    }

    public String dismissal() {
        return DISMISSALS[weighted(DISMISSAL_WEIGHTS)];
    }

    private int weighted(double[] weights) {
        double total = 0;
        for (double v : weights) total += v;
        double r = random.nextDouble() * total;
        for (int i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) return i;
        }
        return weights.length - 1;
    }
}
