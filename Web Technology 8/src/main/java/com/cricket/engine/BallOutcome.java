package com.cricket.engine;

import com.cricket.model.Extra;

/**
 * What happened on one delivery.
 *
 * @param runs      runs off the bat (or extra runs ran on a wide)
 * @param extra     NONE, WIDE or NO_BALL
 * @param wicket    true if a batter was dismissed (legal deliveries only)
 * @param dismissal bowled, caught, lbw, run out, stumped (null = random)
 */
public record BallOutcome(int runs, Extra extra, boolean wicket, String dismissal) {

    public static BallOutcome runs(int r) {
        return new BallOutcome(r, Extra.NONE, false, null);
    }
}
