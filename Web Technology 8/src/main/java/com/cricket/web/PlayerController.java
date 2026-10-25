package com.cricket.web;

import com.cricket.dto.PlayerStatDto;
import com.cricket.service.PlayerStatsService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerStatsService playerStatsService;

    public PlayerController(PlayerStatsService playerStatsService) {
        this.playerStatsService = playerStatsService;
    }

    /** GET /api/players?sort=runs|wickets|sixes|strikeRate&limit=15 */
    @GetMapping
    public List<PlayerStatDto> leaderboard(@RequestParam(defaultValue = "runs") String sort,
                                           @RequestParam(defaultValue = "15") int limit) {
        return playerStatsService.leaderboard(sort, limit);
    }
}
