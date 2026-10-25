package com.cricket.service;

import com.cricket.dto.PlayerStatDto;
import com.cricket.model.BatterScore;
import com.cricket.model.BowlerFigure;
import com.cricket.model.Innings;
import com.cricket.model.Match;
import com.cricket.model.MatchStatus;
import com.cricket.model.Team;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

/** Aggregates player statistics across every started match. */
@Service
public class PlayerStatsService {

    private final MatchService matchService;

    public PlayerStatsService(MatchService matchService) {
        this.matchService = matchService;
    }

    private static final class Acc {
        String name, team, color;
        int matches, innings, runs, balls, high, fours, sixes, wickets, legalBalls, conceded;
        boolean highNotOut;
        int bestW = -1, bestR;
    }

    public List<PlayerStatDto> leaderboard(String sort, int limit) {
        String key = sort == null ? "runs" : sort.toLowerCase(Locale.ROOT);
        Comparator<PlayerStatDto> order = switch (key) {
            case "runs" -> Comparator.comparingInt(PlayerStatDto::runs).reversed().thenComparingInt(PlayerStatDto::balls);
            case "wickets" -> Comparator.comparingInt(PlayerStatDto::wickets).reversed().thenComparingDouble(PlayerStatDto::economy);
            case "sixes" -> Comparator.comparingInt(PlayerStatDto::sixes).reversed().thenComparing(PlayerStatDto::runs, Comparator.reverseOrder());
            case "strikerate" -> Comparator.comparingDouble(PlayerStatDto::strikeRate).reversed();
            default -> throw new ApiException(400, "Unknown sort '" + sort + "'. Use runs, wickets, sixes or strikeRate");
        };

        List<PlayerStatDto> all = all();
        if (key.equals("wickets")) all = all.stream().filter(p -> p.wickets() > 0).toList();
        if (key.equals("strikerate")) all = all.stream().filter(p -> p.balls() >= 30).toList();
        if (key.equals("sixes")) all = all.stream().filter(p -> p.sixes() > 0).toList();
        return all.stream().sorted(order).limit(Math.max(1, Math.min(limit, 100))).toList();
    }

    public List<PlayerStatDto> all() {
        Map<String, Acc> stats = new LinkedHashMap<>();
        matchService.readAll(m -> {
            if (m.getStatus() != MatchStatus.UPCOMING) collect(m, stats);
            return null;
        });
        List<PlayerStatDto> out = new ArrayList<>();
        for (Acc a : stats.values()) {
            out.add(new PlayerStatDto(a.name, a.team, a.color, a.matches, a.innings, a.runs, a.balls, a.high, a.highNotOut,
                a.fours, a.sixes, a.balls == 0 ? 0 : DtoMapper.round2(a.runs * 100.0 / a.balls),
                a.wickets, a.legalBalls / 6 + (a.legalBalls % 6 == 0 ? "" : "." + a.legalBalls % 6), a.conceded,
                a.legalBalls == 0 ? 0 : DtoMapper.round2(a.conceded * 6.0 / a.legalBalls),
                a.bestW < 0 ? "-" : a.bestW + "/" + a.bestR));
        }
        return out;
    }

    private static void collect(Match m, Map<String, Acc> stats) {
        for (Team t : List.of(m.getTeamA(), m.getTeamB())) {
            for (String p : t.players()) acc(stats, t, p).matches++;
        }
        for (Innings i : m.getInnings()) {
            for (BatterScore b : i.getBatters()) {
                Acc a = acc(stats, i.getBattingTeam(), b.getName());
                a.innings++;
                a.runs += b.getRuns();
                a.balls += b.getBalls();
                a.fours += b.getFours();
                a.sixes += b.getSixes();
                if (b.getRuns() > a.high || (b.getRuns() == a.high && !b.isOut())) {
                    a.high = b.getRuns();
                    a.highNotOut = !b.isOut();
                }
            }
            for (BowlerFigure bf : i.getBowlers()) {
                Acc a = acc(stats, i.getBowlingTeam(), bf.getName());
                a.wickets += bf.getWickets();
                a.legalBalls += bf.getLegalBalls();
                a.conceded += bf.getRuns();
                if (bf.getWickets() > a.bestW || (bf.getWickets() == a.bestW && bf.getRuns() < a.bestR)) {
                    a.bestW = bf.getWickets();
                    a.bestR = bf.getRuns();
                }
            }
        }
    }

    private static Acc acc(Map<String, Acc> stats, Team t, String player) {
        return stats.computeIfAbsent(t.shortName() + "|" + player, k -> {
            Acc a = new Acc();
            a.name = player;
            a.team = t.shortName();
            a.color = t.color();
            return a;
        });
    }
}
