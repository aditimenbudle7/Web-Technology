package com.cricket.service;

import com.cricket.dto.BatterDto;
import com.cricket.dto.BowlerDto;
import com.cricket.dto.CommentaryDto;
import com.cricket.dto.CreaseDto;
import com.cricket.dto.InningsScorecardDto;
import com.cricket.dto.InningsSummaryDto;
import com.cricket.dto.MatchDetailDto;
import com.cricket.dto.MatchReportDto;
import com.cricket.dto.MatchSummaryDto;
import com.cricket.dto.PerformerDto;
import com.cricket.dto.TeamDto;
import com.cricket.model.BatterScore;
import com.cricket.model.BowlerFigure;
import com.cricket.model.Commentary;
import com.cricket.model.Innings;
import com.cricket.model.Match;
import com.cricket.model.MatchStatus;
import com.cricket.model.Team;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Converts the mutable match model into immutable DTO snapshots.
 * Must be called while holding the match lock.
 */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static TeamDto team(Team t) {
        return new TeamDto(t.name(), t.shortName(), t.color());
    }

    public static MatchSummaryDto summary(Match m) {
        List<InningsSummaryDto> innings = m.getInnings().stream()
            .map(i -> new InningsSummaryDto(i.getBattingTeam().shortName(), i.getRuns(), i.getWickets(), i.oversText(), i.isComplete()))
            .toList();

        Innings cur = m.currentInnings();
        boolean live = m.getStatus() == MatchStatus.LIVE;
        Double crr = null;
        Double rrr = null;
        Integer target = null;
        String statusText;

        if (cur != null && cur.getLegalBalls() > 0) crr = round2(cur.runRate());
        if (cur != null && cur.getTarget() != null) {
            target = cur.getTarget();
            if (live && cur.remainingBalls() > 0) rrr = round2(cur.requiredRate());
        }

        if (m.getStatus() == MatchStatus.UPCOMING) {
            statusText = "Match yet to begin";
        } else if (m.getStatus() == MatchStatus.COMPLETED) {
            statusText = m.getResult();
        } else if (cur.getTarget() == null) {
            statusText = m.getTossText();
        } else {
            int need = cur.runsNeeded();
            int balls = cur.remainingBalls();
            statusText = cur.getBattingTeam().name() + " need " + need + " run" + (need == 1 ? "" : "s")
                + " from " + balls + " ball" + (balls == 1 ? "" : "s");
        }

        List<String> recent = cur == null ? List.of() : cur.getRecentBalls();
        if (recent.size() > 8) recent = recent.subList(recent.size() - 8, recent.size());

        return new MatchSummaryDto(
            m.getId(), m.getSeries(), m.getFormat().name(), m.getFormat().getOvers(), m.getVenue(),
            m.getStatus().name(), team(m.getTeamA()), team(m.getTeamB()), innings,
            live && cur != null ? cur.getBattingTeam().shortName() : null,
            statusText, crr, rrr, target, recent,
            m.getStartsAt() == null ? null : m.getStartsAt().toString(),
            m.isPaused(), m.getResult(), m.getWinnerShortName(), m.getUpdatedAt().toString());
    }

    public static MatchDetailDto detail(Match m, int commentaryLimit) {
        return new MatchDetailDto(summary(m), crease(m), scorecard(m), commentary(m, commentaryLimit), report(m));
    }

    public static CreaseDto crease(Match m) {
        Innings cur = m.currentInnings();
        if (cur == null || m.getStatus() != MatchStatus.LIVE) return null;
        BowlerFigure bowler = cur.getCurrentBowler();
        return new CreaseDto(
            batter(cur, cur.getStrikerIdx()),
            batter(cur, cur.getNonStrikerIdx()),
            bowler == null ? null : bowler(bowler, true),
            cur.getPartnershipRuns() + " (" + cur.getPartnershipBalls() + ")",
            cur.getThisOver());
    }

    public static List<InningsScorecardDto> scorecard(Match m) {
        List<InningsScorecardDto> list = new ArrayList<>();
        for (Innings i : m.getInnings()) {
            List<BatterDto> batters = new ArrayList<>();
            for (int idx = 0; idx < i.getBatters().size(); idx++) batters.add(batter(i, idx));
            List<BowlerDto> bowlers = i.getBowlers().stream()
                .map(b -> bowler(b, b == i.getCurrentBowler()))
                .toList();
            int extras = i.getWides() + i.getNoBalls();
            list.add(new InningsScorecardDto(
                team(i.getBattingTeam()), team(i.getBowlingTeam()),
                i.getRuns(), i.getWickets(), i.oversText(), round2(i.runRate()), i.getTarget(),
                extras, "(wd " + i.getWides() + ", nb " + i.getNoBalls() + ")",
                batters, i.yetToBat(), bowlers, i.getFallOfWickets(), i.getRunsPerOver(), i.isComplete()));
        }
        return list;
    }

    public static List<CommentaryDto> commentary(Match m, int limit) {
        return m.latestCommentary(Math.max(1, Math.min(limit, Match.MAX_COMMENTARY))).stream()
            .map(DtoMapper::commentary)
            .toList();
    }

    private static CommentaryDto commentary(Commentary c) {
        return new CommentaryDto(c.over(), c.text(), c.type().name(), c.time().toString());
    }

    public static MatchReportDto report(Match m) {
        int runs = 0, wickets = 0, fours = 0, sixes = 0, extras = 0;
        List<PerformerDto> topBatters = new ArrayList<>();
        List<PerformerDto> topBowlers = new ArrayList<>();
        for (Innings i : m.getInnings()) {
            runs += i.getRuns();
            wickets += i.getWickets();
            extras += i.getWides() + i.getNoBalls();
            String bat = i.getBattingTeam().shortName();
            String bowl = i.getBowlingTeam().shortName();
            for (BatterScore b : i.getBatters()) {
                fours += b.getFours();
                sixes += b.getSixes();
            }
            i.getBatters().stream()
                .sorted(Comparator.comparingInt(BatterScore::getRuns).reversed().thenComparingInt(BatterScore::getBalls))
                .limit(2)
                .forEach(b -> topBatters.add(new PerformerDto(b.getName(), bat,
                    b.getRuns() + (b.isOut() ? "" : "*") + " (" + b.getBalls() + ")")));
            i.getBowlers().stream()
                .sorted(Comparator.comparingInt(BowlerFigure::getWickets).reversed().thenComparingInt(BowlerFigure::getRuns))
                .limit(2)
                .forEach(b -> topBowlers.add(new PerformerDto(b.getName(), bowl,
                    b.getWickets() + "/" + b.getRuns() + " (" + b.oversText() + ")")));
        }
        return new MatchReportDto(m.getResult(), m.getTossText(), m.getPlayerOfMatch(),
            runs, wickets, fours, sixes, extras, topBatters, topBowlers);
    }

    private static BatterDto batter(Innings i, int idx) {
        BatterScore b = i.getBatters().get(idx);
        boolean striker = idx == i.getStrikerIdx();
        boolean atCrease = !b.isOut() && (striker || idx == i.getNonStrikerIdx());
        String status = b.isOut() ? b.getDismissal() : i.isComplete() ? "not out" : "batting";
        return new BatterDto(b.getName(), b.getRuns(), b.getBalls(), b.getFours(), b.getSixes(),
            round2(b.strikeRate()), status, b.isOut(), striker && atCrease && !i.isComplete(), atCrease && !i.isComplete());
    }

    private static BowlerDto bowler(BowlerFigure b, boolean current) {
        return new BowlerDto(b.getName(), b.oversText(), b.getMaidens(), b.getRuns(), b.getWickets(),
            round2(b.economy()), current);
    }

    static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
