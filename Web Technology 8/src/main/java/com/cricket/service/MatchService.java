package com.cricket.service;

import com.cricket.data.TeamCatalog;
import com.cricket.dto.CommentaryDto;
import com.cricket.dto.InningsScorecardDto;
import com.cricket.dto.MatchDetailDto;
import com.cricket.dto.MatchReportDto;
import com.cricket.dto.MatchSummaryDto;
import com.cricket.dto.OverviewDto;
import com.cricket.dto.ScoreUpdateRequest;
import com.cricket.engine.BallOutcome;
import com.cricket.engine.MatchSimulator;
import com.cricket.model.Extra;
import com.cricket.model.Innings;
import com.cricket.model.Match;
import com.cricket.model.MatchFormat;
import com.cricket.model.MatchStatus;
import com.cricket.model.Team;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Holds all matches in memory and drives the live simulation.
 *
 * Concurrency: matches live in a ConcurrentHashMap; every read or write of a
 * single match is done inside synchronized (match), so the simulator thread,
 * manual score updates and REST reads never see a half-updated scorecard.
 * Readers always receive immutable DTO snapshots.
 */
@Service
public class MatchService {

    private static final int MAX_COMPLETED = 12;
    private static final int MIN_ACTIVE = 4; // live + upcoming matches kept running

    private final Map<String, Match> matches = new ConcurrentHashMap<>();
    private final List<Consumer<List<MatchSummaryDto>>> listeners = new CopyOnWriteArrayList<>();
    private final AtomicInteger idSequence = new AtomicInteger();
    private final Random random;
    private final MatchSimulator simulator;
    private final List<Team> teams;
    private final double ballProbability;

    public MatchService(@Value("${app.simulation.seed:0}") long seed,
                        @Value("${app.simulation.ball-probability:0.8}") double ballProbability) {
        this.random = seed == 0 ? new Random() : new Random(seed);
        this.simulator = new MatchSimulator(random);
        this.teams = TeamCatalog.createTeams(random);
        this.ballProbability = ballProbability;
        seedDemoMatches();
    }

    // ------------------------------------------------------------------ demo data

    private void seedDemoMatches() {
        // Completed matches (fully simulated)
        createSimulated(MatchFormat.T20, "Premier T20 League", -1, -1);
        createSimulated(MatchFormat.ODI, "Inter-City One-Day Cup", -1, -1);
        createSimulated(MatchFormat.T20, "Premier T20 League", -1, -1);
        // Live matches at different stages: (innings index, legal balls bowled in that innings)
        createSimulated(MatchFormat.T20, "Premier T20 League", 1, 13 * 6 + 2);
        createSimulated(MatchFormat.T20, "Premier T20 League", 0, 9 * 6 + 4);
        createSimulated(MatchFormat.ODI, "Inter-City One-Day Cup", 0, 23 * 6 + 1);
        createSimulated(MatchFormat.T10, "City T10 Blast", 0, 3 * 6);
        // Upcoming
        createUpcoming(MatchFormat.T10, "City T10 Blast", Duration.ofSeconds(75));
        createUpcoming(MatchFormat.T20, "Premier T20 League", Duration.ofMinutes(4));
    }

    private Team[] pickTeams() {
        Set<String> busy = new HashSet<>();
        matches.values().stream().filter(m -> m.getStatus() != MatchStatus.COMPLETED).forEach(m -> {
            busy.add(m.getTeamA().shortName());
            busy.add(m.getTeamB().shortName());
        });
        List<Team> free = new ArrayList<>(teams.stream().filter(t -> !busy.contains(t.shortName())).toList());
        if (free.size() < 2) free = new ArrayList<>(teams);
        Team a = free.remove(random.nextInt(free.size()));
        Team b = free.get(random.nextInt(free.size()));
        return new Team[] {a, b};
    }

    private Match newMatch(MatchFormat format, String series, Instant startsAt) {
        Team[] t = pickTeams();
        String venue = TeamCatalog.VENUES.get(teams.indexOf(t[0]) % TeamCatalog.VENUES.size());
        String id = "m" + idSequence.incrementAndGet();
        Match m = new Match(id, series, venue, format, t[0], t[1], startsAt);
        matches.put(id, m);
        return m;
    }

    private Match createUpcoming(MatchFormat format, String series, Duration startsIn) {
        return newMatch(format, series, Instant.now().plus(startsIn));
    }

    /** Creates a match and fast-forwards it. inningsIdx = -1 plays it to completion. */
    private void createSimulated(MatchFormat format, String series, int inningsIdx, int legalBalls) {
        Match m = newMatch(format, series, Instant.now().minus(Duration.ofMinutes(30 + random.nextInt(120))));
        synchronized (m) {
            simulator.start(m);
            while (m.getStatus() == MatchStatus.LIVE) {
                if (inningsIdx >= 0) {
                    Innings cur = m.currentInnings();
                    int idx = m.getInnings().size() - 1;
                    if (idx > inningsIdx || (idx == inningsIdx && cur.getLegalBalls() >= legalBalls)) break;
                }
                simulator.bowlAuto(m);
            }
        }
    }

    // ------------------------------------------------------------------ live simulation

    @Scheduled(fixedDelayString = "${app.simulation.tick-ms:2000}", initialDelay = 1500)
    public void tick() {
        List<MatchSummaryDto> changed = new ArrayList<>();
        Instant now = Instant.now();
        int finished = 0;
        for (Match m : matches.values()) {
            synchronized (m) {
                if (m.getStatus() == MatchStatus.UPCOMING && !m.getStartsAt().isAfter(now)) {
                    simulator.start(m);
                    changed.add(DtoMapper.summary(m));
                } else if (m.getStatus() == MatchStatus.LIVE && !m.isPaused() && random.nextDouble() < ballProbability) {
                    simulator.bowlAuto(m);
                    if (m.getStatus() == MatchStatus.COMPLETED) finished++;
                    changed.add(DtoMapper.summary(m));
                }
            }
        }
        changed.addAll(keepScheduleFull(finished));
        trimCompleted();
        publish(changed);
    }

    /** Schedules new fixtures so there are always matches to follow. */
    private List<MatchSummaryDto> keepScheduleFull(int finished) {
        List<MatchSummaryDto> created = new ArrayList<>();
        long active = matches.values().stream().filter(m -> m.getStatus() != MatchStatus.COMPLETED).count();
        int needed = (int) Math.max(finished, MIN_ACTIVE - active);
        for (int i = 0; i < needed; i++) {
            boolean t10 = random.nextDouble() < 0.4;
            Match m = createUpcoming(t10 ? MatchFormat.T10 : MatchFormat.T20,
                t10 ? "City T10 Blast" : "Premier T20 League", Duration.ofSeconds(60 + 30L * i));
            synchronized (m) {
                created.add(DtoMapper.summary(m));
            }
        }
        return created;
    }

    private void trimCompleted() {
        List<Match> completed = matches.values().stream()
            .filter(m -> m.getStatus() == MatchStatus.COMPLETED)
            .sorted(Comparator.comparing(Match::getUpdatedAt).reversed())
            .toList();
        completed.stream().skip(MAX_COMPLETED).forEach(m -> matches.remove(m.getId()));
    }

    // ------------------------------------------------------------------ listeners (real-time push)

    public void addListener(Consumer<List<MatchSummaryDto>> listener) {
        listeners.add(listener);
    }

    private void publish(List<MatchSummaryDto> changed) {
        if (changed.isEmpty()) return;
        List<MatchSummaryDto> snapshot = List.copyOf(changed);
        for (Consumer<List<MatchSummaryDto>> l : listeners) {
            try {
                l.accept(snapshot);
            } catch (RuntimeException ignored) {
                // a failing listener must never stop the simulation
            }
        }
    }

    // ------------------------------------------------------------------ queries

    public List<MatchSummaryDto> list(String status) {
        MatchStatus filter = parseStatus(status);
        return matches.values().stream()
            .filter(m -> filter == null || m.getStatus() == filter)
            .sorted(DISPLAY_ORDER)
            .map(m -> read(m, DtoMapper::summary))
            .toList();
    }

    public MatchSummaryDto summary(String id) {
        return read(require(id), DtoMapper::summary);
    }

    public MatchDetailDto detail(String id, int commentaryLimit) {
        return read(require(id), m -> DtoMapper.detail(m, commentaryLimit));
    }

    public List<InningsScorecardDto> scorecard(String id) {
        return read(require(id), DtoMapper::scorecard);
    }

    public List<CommentaryDto> commentary(String id, int limit) {
        return read(require(id), m -> DtoMapper.commentary(m, limit));
    }

    public MatchReportDto report(String id) {
        return read(require(id), DtoMapper::report);
    }

    public OverviewDto overview(int viewers) {
        int live = 0, upcoming = 0, completed = 0, runs = 0, wickets = 0, fours = 0, sixes = 0;
        long balls = 0;
        for (Match m : matches.values()) {
            synchronized (m) {
                switch (m.getStatus()) {
                    case LIVE -> live++;
                    case UPCOMING -> upcoming++;
                    case COMPLETED -> completed++;
                }
                MatchReportDto r = DtoMapper.report(m);
                runs += r.totalRuns();
                wickets += r.totalWickets();
                fours += r.fours();
                sixes += r.sixes();
                balls += m.getBallsBowled();
            }
        }
        return new OverviewDto(live, upcoming, completed, runs, wickets, fours, sixes, balls, viewers);
    }

    /** Runs a read-only function on each match while holding its lock (used for player stats). */
    public <T> List<T> readAll(Function<Match, T> reader) {
        return matches.values().stream().map(m -> read(m, reader)).toList();
    }

    // ------------------------------------------------------------------ commands

    public MatchSummaryDto recordBall(String id, ScoreUpdateRequest req) {
        Match m = require(id);
        int runs = req.runs() == null ? 0 : req.runs();
        boolean wicket = Boolean.TRUE.equals(req.wicket());
        Extra extra = parseExtra(req.extra());
        String dismissal = req.dismissal() == null || req.dismissal().isBlank() ? null : req.dismissal().trim().toLowerCase(Locale.ROOT);

        if (runs < 0 || runs > 6) throw new ApiException(400, "Runs must be between 0 and 6");
        if (wicket && extra != Extra.NONE) throw new ApiException(400, "A wicket can only be recorded on a legal delivery");
        if (dismissal != null && !List.of("bowled", "caught", "lbw", "run out", "stumped").contains(dismissal)) {
            throw new ApiException(400, "Unknown dismissal type: " + dismissal);
        }

        MatchSummaryDto result;
        boolean finished;
        synchronized (m) {
            if (m.getStatus() != MatchStatus.LIVE) throw new ApiException(409, "Only live matches can be updated");
            simulator.apply(m, new BallOutcome(wicket ? 0 : runs, extra, wicket, dismissal));
            finished = m.getStatus() == MatchStatus.COMPLETED;
            result = DtoMapper.summary(m);
        }
        List<MatchSummaryDto> changed = new ArrayList<>(List.of(result));
        if (finished) changed.addAll(keepScheduleFull(1));
        publish(changed);
        return result;
    }

    public MatchSummaryDto setPaused(String id, boolean paused) {
        Match m = require(id);
        MatchSummaryDto result;
        synchronized (m) {
            if (m.getStatus() != MatchStatus.LIVE) throw new ApiException(409, "Only live matches can be paused or resumed");
            m.setPaused(paused);
            result = DtoMapper.summary(m);
        }
        publish(List.of(result));
        return result;
    }

    // ------------------------------------------------------------------ helpers

    private Match require(String id) {
        Match m = matches.get(id);
        if (m == null) throw ApiException.notFound("Match " + id);
        return m;
    }

    private static <T> T read(Match m, Function<Match, T> reader) {
        synchronized (m) {
            return reader.apply(m);
        }
    }

    /** Live first (stable order), then upcoming by start time, then latest results. */
    private static final Comparator<Match> DISPLAY_ORDER = (a, b) -> {
        int ra = rank(a.getStatus()), rb = rank(b.getStatus());
        if (ra != rb) return Integer.compare(ra, rb);
        return switch (a.getStatus()) {
            case LIVE -> Integer.compare(number(a), number(b));
            case UPCOMING -> a.getStartsAt().compareTo(b.getStartsAt());
            case COMPLETED -> b.getUpdatedAt().compareTo(a.getUpdatedAt());
        };
    };

    private static int rank(MatchStatus s) {
        return switch (s) {
            case LIVE -> 0;
            case UPCOMING -> 1;
            case COMPLETED -> 2;
        };
    }

    private static int number(Match m) {
        return Integer.parseInt(m.getId().substring(1));
    }

    private static MatchStatus parseStatus(String s) {
        if (s == null || s.isBlank() || s.equalsIgnoreCase("ALL")) return null;
        try {
            return MatchStatus.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "Unknown status '" + s + "'. Use LIVE, UPCOMING, COMPLETED or ALL");
        }
    }

    private static Extra parseExtra(String s) {
        if (s == null || s.isBlank()) return Extra.NONE;
        try {
            return Extra.valueOf(s.trim().toUpperCase(Locale.ROOT).replace('-', '_'));
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "Unknown extra '" + s + "'. Use NONE, WIDE or NO_BALL");
        }
    }
}
