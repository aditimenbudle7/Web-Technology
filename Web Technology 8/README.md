# CricPulse: Real-time Cricket Score Management System

A Spring Boot application that simulates a live cricket scoring platform. It generates and processes ball-by-ball match data, serves it through REST APIs, and pushes live updates to a responsive dashboard using Server-Sent Events (SSE).

> All teams, players and matches are **simulated** (fictional franchise teams), so the project runs without any external API keys or database.

## Features
- **Live match engine:** ball-by-ball simulation of T10, T20 and ODI matches following real limited-overs rules:
  - legal deliveries, wides, no-balls, strike rotation, end-of-over changes
  - bowler quotas (max 1/5 of the overs, no consecutive overs), dismissal types (caught, bowled, lbw, run out, stumped)
  - innings breaks, targets, required run rate, results (won by runs / wickets / tie) and player of the match
  - outcome probabilities depend on format, phase (powerplay / death overs), chase pressure and tail-enders
- **Several concurrent matches:** live, upcoming (with countdown) and completed; new fixtures are scheduled automatically so there is always something live.
- **Real-time updates:** the server pushes score changes over SSE (`/api/stream`), so the dashboard updates without refreshing.
- **Match centre:** live scoreboard, CRR/RRR/target, batters at the crease, current bowler, this over, partnership, commentary, full scorecard (fall of wickets, extras, bowling figures), Manhattan and worm charts, match summary.
- **Manual scoring:** pause the simulation and record deliveries yourself (0, 1, 2, 3, 4, 6, W, Wd, Nb) through the dashboard or the REST API.
- **Player statistics:** leaderboards for runs, wickets, sixes and strike rate aggregated across all matches.
- **Responsive dashboard:** desktop, tablet and mobile layouts with light and dark themes.

## Tech stack
- **Backend:** Java 17+, Spring Boot 3 (Spring Web, scheduling, `SseEmitter`)
- **Frontend:** HTML, CSS and vanilla JavaScript served by Spring Boot (`src/main/resources/static`)
- **Build:** Maven (wrapper included, so no Maven install needed)

## Run
Requires **JDK 17 or newer** (`java -version`).

Windows:
```
mvnw.cmd spring-boot:run
```
macOS / Linux:
```
./mvnw spring-boot:run
```
Open **http://localhost:8080**. The first run downloads dependencies (a few minutes).

Configuration (`src/main/resources/application.properties`):

| Property | Default | Meaning |
|---|---|---|
| `app.simulation.tick-ms` | `2000` | How often the next ball is bowled in live matches |
| `app.simulation.ball-probability` | `0.8` | Chance a live match advances on each tick (staggers matches) |
| `app.simulation.seed` | `0` | `0` = new random matches each start; any other number = repeatable data |

## REST API
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/matches?status=LIVE\|UPCOMING\|COMPLETED` | Match list (all when no status) |
| GET | `/api/matches/{id}?commentary=40` | Match centre: summary, crease, scorecard, commentary, report |
| GET | `/api/matches/{id}/scorecard` | Scorecard for both innings |
| GET | `/api/matches/{id}/commentary?limit=30` | Latest ball-by-ball commentary |
| GET | `/api/matches/{id}/summary` | Result, player of the match, top performers |
| POST | `/api/matches/{id}/score` | Record a delivery: `{"runs":4}`, `{"wicket":true}`, `{"extra":"WIDE"}`, `{"runs":1,"extra":"NO_BALL"}` |
| POST | `/api/matches/{id}/pause` / `/resume` | Pause or resume the automatic simulation |
| GET | `/api/players?sort=runs\|wickets\|sixes\|strikeRate&limit=15` | Player leaderboard |
| GET | `/api/overview` | Totals across all matches |
| GET | `/api/stream` | Server-Sent Events stream (`score` events) |

Errors are returned as JSON, e.g. `{"error": "Only live matches can be updated"}` with status 400 / 404 / 409.

## Architecture
```
Browser (dashboard)  ── REST (fetch) ──►  Controllers ──► MatchService ──► MatchSimulator (rules engine)
        ▲                                                     │
        └──────────── SSE "score" events ◄── LiveUpdateBroadcaster ◄── listener (on every change)
```
```
src/main/java/com/cricket/
├── CricketScoreApplication.java   entry point (+ @EnableScheduling)
├── model/        Match, Innings, BatterScore, BowlerFigure, Team, enums
├── engine/       MatchSimulator (cricket rules), OutcomeGenerator (probabilities), CommentaryWriter
├── data/         TeamCatalog (fictional teams, players, venues)
├── service/      MatchService (state + scheduler), PlayerStatsService, DtoMapper, ApiException
├── dto/          immutable response records
├── realtime/     LiveUpdateBroadcaster (SSE)
└── web/          MatchController, PlayerController, StreamController, GlobalExceptionHandler
src/main/resources/static/   index.html, css/styles.css, js/app.js
```

### Scalability and efficiency
- **Push instead of poll:** clients receive only changed match summaries over one SSE connection instead of repeatedly polling every endpoint.
- **Thread safety:** matches are stored in a `ConcurrentHashMap`; each match is updated and read under its own lock, so different matches are processed independently and readers never see half-updated scores.
- **Immutable snapshots:** APIs return DTO records built under the lock, so slow clients never block the simulation.
- **Bounded memory:** commentary is capped per match, and old completed matches are trimmed automatically.
- **Pluggable data source:** the simulation engine sits behind `MatchService`, so it could be replaced by a real data provider, and the in-memory store by Redis or a database, without changing the API or dashboard.
