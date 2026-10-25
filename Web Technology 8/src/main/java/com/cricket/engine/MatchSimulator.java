package com.cricket.engine;

import com.cricket.model.BatterScore;
import com.cricket.model.BowlerFigure;
import com.cricket.model.CommentaryType;
import com.cricket.model.Extra;
import com.cricket.model.Innings;
import com.cricket.model.Match;
import com.cricket.model.MatchStatus;
import com.cricket.model.Team;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Applies the rules of limited-overs cricket to a match, one delivery at a time.
 * Callers must hold the match's lock.
 */
public class MatchSimulator {

    private final Random random;
    private final OutcomeGenerator generator;
    private final CommentaryWriter writer;

    public MatchSimulator(Random random) {
        this.random = random;
        this.generator = new OutcomeGenerator(random);
        this.writer = new CommentaryWriter(random);
    }

    // ------------------------------------------------------------------ start

    public void start(Match m) {
        if (m.getStatus() != MatchStatus.UPCOMING) return;
        Team tossWinner = random.nextBoolean() ? m.getTeamA() : m.getTeamB();
        boolean bat = random.nextBoolean();
        Team battingFirst = bat ? tossWinner : m.other(tossWinner);
        m.setTossText(tossWinner.name() + " won the toss and chose to " + (bat ? "bat" : "bowl"));
        m.setStatus(MatchStatus.LIVE);
        m.addCommentary("", "Toss: " + m.getTossText() + ".", CommentaryType.INFO);
        startInnings(m, battingFirst, m.other(battingFirst), null);
    }

    private void startInnings(Match m, Team batting, Team bowling, Integer target) {
        Innings inn = new Innings(batting, bowling, m.getFormat().getOvers(), target);
        inn.openBatters();
        m.addInnings(inn);
        String chase = target == null ? "" : " Target: " + target + " from " + m.getFormat().getOvers() + " overs.";
        m.addCommentary("0.0", inn.striker().getName() + " and " + inn.nonStriker().getName()
            + " walk out to open for " + batting.name() + "." + chase, CommentaryType.INFO);
        newOver(m, inn);
    }

    // ------------------------------------------------------------------ deliveries

    public void bowlAuto(Match m) {
        if (m.getStatus() != MatchStatus.LIVE) return;
        apply(m, generator.next(m.getFormat(), m.currentInnings()));
    }

    public void apply(Match m, BallOutcome o) {
        if (m.getStatus() != MatchStatus.LIVE) throw new IllegalStateException("Match is not live");
        Innings inn = m.currentInnings();
        if (inn.getCurrentBowler() == null) newOver(m, inn);

        BowlerFigure bowler = inn.getCurrentBowler();
        BatterScore striker = inn.striker();
        String label = inn.nextBallLabel();
        int runs = Math.max(0, Math.min(6, o.runs()));
        String text;
        CommentaryType type;
        String newBatterText = null;

        switch (o.extra()) {
            case WIDE -> {
                int total = 1 + runs;
                inn.addWide(total);
                bowler.concede(total);
                inn.recordBall(total, runs == 0 ? "Wd" : total + "Wd");
                inn.addPartnership(total, 0);
                text = writer.wide(bowler.getName(), striker.getName(), total);
                type = CommentaryType.EXTRA;
                if (runs % 2 == 1) inn.swapStrike();
            }
            case NO_BALL -> {
                int total = 1 + runs;
                inn.addNoBall(total);
                bowler.concede(total);
                striker.faceBall(runs);
                inn.recordBall(total, runs == 0 ? "Nb" : runs + "Nb");
                inn.addPartnership(total, 1);
                text = writer.noBall(bowler.getName(), striker.getName(), runs);
                type = CommentaryType.EXTRA;
                if (runs % 2 == 1) inn.swapStrike();
            }
            default -> {
                inn.legalBall();
                bowler.legalBall();
                if (o.wicket()) {
                    String how = o.dismissal() != null ? o.dismissal() : generator.dismissal();
                    String dismissal = describeDismissal(how, bowler.getName(), inn.getBowlingTeam());
                    striker.faceBall(0);
                    striker.dismiss(dismissal);
                    if (!"run out".equals(how)) bowler.takeWicket();
                    inn.wicketFell(striker, label);
                    inn.recordBall(0, "W");
                    text = writer.wicket(bowler.getName(), striker.getName(), dismissal, striker.getRuns(), striker.getBalls());
                    type = CommentaryType.WICKET;
                    if (inn.getWickets() < 10) {
                        BatterScore next = inn.newBatterAtStrike();
                        newBatterText = next.getName() + " walks in at number " + (inn.getWickets() + 2) + ".";
                    }
                } else {
                    striker.faceBall(runs);
                    inn.addRuns(runs);
                    bowler.concede(runs);
                    inn.recordBall(runs, String.valueOf(runs));
                    inn.addPartnership(runs, 1);
                    text = writer.runs(bowler.getName(), striker.getName(), runs);
                    type = runs == 4 ? CommentaryType.FOUR : runs == 6 ? CommentaryType.SIX : CommentaryType.NORMAL;
                    if (runs % 2 == 1) inn.swapStrike();
                }
            }
        }

        m.addCommentary(label, text, type);
        if (newBatterText != null) m.addCommentary(label, newBatterText, CommentaryType.INFO);
        m.incrementBalls();

        boolean overDone = o.extra() == Extra.NONE && inn.getLegalBalls() % 6 == 0;
        boolean inningsDone = inn.getWickets() >= 10
            || inn.getLegalBalls() >= inn.getMaxBalls()
            || (inn.getTarget() != null && inn.getRuns() >= inn.getTarget());

        if (overDone) endOver(m, inn);
        if (inningsDone) {
            inn.closeOver();
            endInnings(m, inn);
        } else if (overDone) {
            newOver(m, inn);
        }
    }

    private String describeDismissal(String how, String bowler, Team fielding) {
        List<String> fielders = new ArrayList<>(fielding.players());
        fielders.remove(bowler);
        String fielder = fielders.get(random.nextInt(fielders.size()));
        return switch (how) {
            case "bowled" -> "b " + bowler;
            case "lbw" -> "lbw b " + bowler;
            case "stumped" -> "st " + fielding.keeper() + " b " + bowler;
            case "run out" -> "run out (" + fielder + ")";
            default -> fielder.equals(fielding.keeper()) || random.nextDouble() < 0.15
                ? "c " + fielding.keeper() + " b " + bowler
                : "c " + fielder + " b " + bowler;
        };
    }

    // ------------------------------------------------------------------ overs & innings

    private void newOver(Match m, Innings inn) {
        String name = chooseBowler(m, inn);
        boolean firstSpell = inn.getBowlers().stream().noneMatch(b -> b.getName().equals(name));
        BowlerFigure fig = inn.bowlerFigure(name);
        fig.startOver();
        inn.setCurrentBowler(fig);
        if (firstSpell && inn.getLegalBalls() > 0) {
            m.addCommentary(inn.nextBallLabel(), name + " is brought into the attack.", CommentaryType.INFO);
        }
    }

    private String chooseBowler(Match m, Innings inn) {
        int max = m.getFormat().maxOversPerBowler();
        String prev = inn.getPreviousOverBowler();
        List<String> candidates = inn.getBowlingTeam().bowlingOptions().stream()
            .filter(n -> !n.equals(prev) && inn.oversBowledBy(n) < max)
            .sorted(Comparator.comparingInt(inn::oversBowledBy))
            .toList();
        if (candidates.isEmpty()) {
            candidates = inn.getBowlingTeam().players().stream().filter(n -> !n.equals(prev)).toList();
        }
        // Prefer bowlers with fewer overs, with some randomness
        int pool = Math.min(3, candidates.size());
        return candidates.get(random.nextInt(pool));
    }

    private void endOver(Match m, Innings inn) {
        BowlerFigure bowler = inn.getCurrentBowler();
        bowler.finishOver();
        int overRuns = inn.getRunsThisOver();
        int overNo = inn.getLegalBalls() / 6;
        inn.closeOver();
        inn.setPreviousOverBowler(bowler.getName());
        inn.setCurrentBowler(null);
        inn.swapStrike();
        BatterScore a = inn.striker();
        BatterScore b = inn.nonStriker();
        m.addCommentary(overNo + ".0", "End of over " + overNo + ": " + overRuns + " run" + (overRuns == 1 ? "" : "s")
            + " | " + inn.getBattingTeam().shortName() + " " + inn.getRuns() + "/" + inn.getWickets()
            + " | " + a.getName() + " " + a.getRuns() + "(" + a.getBalls() + "), "
            + b.getName() + " " + b.getRuns() + "(" + b.getBalls() + ")", CommentaryType.OVER);
    }

    private void endInnings(Match m, Innings inn) {
        inn.setCurrentBowler(null);
        inn.markComplete();
        if (m.getInnings().size() == 1) {
            int target = inn.getRuns() + 1;
            m.addCommentary(inn.oversText(), "Innings break: " + inn.getBattingTeam().name() + " finish on "
                + inn.getRuns() + "/" + inn.getWickets() + " (" + inn.oversText() + " ov). "
                + inn.getBowlingTeam().name() + " need " + target + " to win.", CommentaryType.INFO);
            startInnings(m, inn.getBowlingTeam(), inn.getBattingTeam(), target);
        } else {
            finishMatch(m);
        }
    }

    private void finishMatch(Match m) {
        Innings first = m.getInnings().get(0);
        Innings second = m.getInnings().get(1);
        String result;
        if (second.getRuns() >= second.getTarget()) {
            int wkts = 10 - second.getWickets();
            int balls = second.remainingBalls();
            result = second.getBattingTeam().name() + " won by " + plural(wkts, "wicket")
                + (balls > 0 ? " (" + plural(balls, "ball") + " left)" : "");
            m.setWinnerShortName(second.getBattingTeam().shortName());
        } else if (second.getRuns() == first.getRuns()) {
            result = "Match tied";
        } else {
            result = first.getBattingTeam().name() + " won by " + plural(first.getRuns() - second.getRuns(), "run");
            m.setWinnerShortName(first.getBattingTeam().shortName());
        }
        m.setResult(result);
        m.setPlayerOfMatch(playerOfMatch(m));
        m.setStatus(MatchStatus.COMPLETED);
        m.addCommentary(second.oversText(), "RESULT: " + result + ". Player of the match: " + m.getPlayerOfMatch() + ".",
            CommentaryType.INFO);
    }

    /** Simple impact score: runs + strike-rate bonus + 25 per wicket, winners get a small bonus. */
    private String playerOfMatch(Match m) {
        Map<String, Double> points = new HashMap<>();
        for (Innings inn : m.getInnings()) {
            boolean battingWon = inn.getBattingTeam().shortName().equals(m.getWinnerShortName());
            for (BatterScore b : inn.getBatters()) {
                double p = b.getRuns() + (b.getBalls() >= 10 ? (b.strikeRate() - 100) / 10 : 0);
                points.merge(b.getName(), p + (battingWon ? 5 : 0), Double::sum);
            }
            for (BowlerFigure bf : inn.getBowlers()) {
                double p = bf.getWickets() * 25 + bf.getMaidens() * 5 - Math.max(0, bf.economy() - 8) * 2;
                points.merge(bf.getName(), p + (battingWon ? 0 : 5), Double::sum);
            }
        }
        return points.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("-");
    }

    private static String plural(int n, String word) {
        return n + " " + word + (n == 1 ? "" : "s");
    }
}
