package com.cricket.web;

import com.cricket.dto.CommentaryDto;
import com.cricket.dto.InningsScorecardDto;
import com.cricket.dto.MatchDetailDto;
import com.cricket.dto.MatchReportDto;
import com.cricket.dto.MatchSummaryDto;
import com.cricket.dto.OverviewDto;
import com.cricket.dto.ScoreUpdateRequest;
import com.cricket.realtime.LiveUpdateBroadcaster;
import com.cricket.service.MatchService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MatchController {

    private final MatchService matchService;
    private final LiveUpdateBroadcaster broadcaster;

    public MatchController(MatchService matchService, LiveUpdateBroadcaster broadcaster) {
        this.matchService = matchService;
        this.broadcaster = broadcaster;
    }

    /** GET /api/matches?status=LIVE|UPCOMING|COMPLETED|ALL */
    @GetMapping("/matches")
    public List<MatchSummaryDto> matches(@RequestParam(required = false) String status) {
        return matchService.list(status);
    }

    /** Full match centre: summary, crease, scorecard, commentary and report. */
    @GetMapping("/matches/{id}")
    public MatchDetailDto match(@PathVariable String id,
                               @RequestParam(defaultValue = "40") int commentary) {
        return matchService.detail(id, commentary);
    }

    @GetMapping("/matches/{id}/scorecard")
    public List<InningsScorecardDto> scorecard(@PathVariable String id) {
        return matchService.scorecard(id);
    }

    @GetMapping("/matches/{id}/commentary")
    public List<CommentaryDto> commentary(@PathVariable String id,
                                          @RequestParam(defaultValue = "30") int limit) {
        return matchService.commentary(id, limit);
    }

    @GetMapping("/matches/{id}/summary")
    public MatchReportDto summary(@PathVariable String id) {
        return matchService.report(id);
    }

    /** Manual scoring: record one delivery. */
    @PostMapping("/matches/{id}/score")
    public MatchSummaryDto score(@PathVariable String id, @RequestBody ScoreUpdateRequest request) {
        return matchService.recordBall(id, request);
    }

    @PostMapping("/matches/{id}/pause")
    public MatchSummaryDto pause(@PathVariable String id) {
        return matchService.setPaused(id, true);
    }

    @PostMapping("/matches/{id}/resume")
    public MatchSummaryDto resume(@PathVariable String id) {
        return matchService.setPaused(id, false);
    }

    @GetMapping("/overview")
    public OverviewDto overview() {
        return matchService.overview(broadcaster.connectedClients());
    }
}
