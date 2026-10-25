package com.cricket.dto;

import java.util.List;

public record MatchDetailDto(
    MatchSummaryDto summary,
    CreaseDto crease,
    List<InningsScorecardDto> scorecard,
    List<CommentaryDto> commentary,
    MatchReportDto report) {
}
