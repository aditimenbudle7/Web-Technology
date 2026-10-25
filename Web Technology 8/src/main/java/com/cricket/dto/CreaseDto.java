package com.cricket.dto;

import java.util.List;

/** Who is batting and bowling right now. */
public record CreaseDto(
    BatterDto striker,
    BatterDto nonStriker,
    BowlerDto bowler,
    String partnership,
    List<String> thisOver) {
}
