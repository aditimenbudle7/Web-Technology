package com.cricket.dto;

/**
 * Manual score update from the scorer panel.
 *
 * @param runs      runs off the bat, 0-6 (runs taken on a wide for extra="WIDE")
 * @param extra     "NONE" (default), "WIDE" or "NO_BALL"
 * @param wicket    true if a batter is out (legal deliveries only)
 * @param dismissal optional: bowled, caught, lbw, run out, stumped
 */
public record ScoreUpdateRequest(Integer runs, String extra, Boolean wicket, String dismissal) {
}
