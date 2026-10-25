package com.cricket.model;

import java.util.List;

/** A team of 11 players. Players 6-11 (index 5..10) are the bowling options. */
public record Team(String name, String shortName, String color, List<String> players) {

    public List<String> bowlingOptions() {
        return players.subList(5, players.size());
    }

    public String keeper() {
        return players.get(4);
    }
}
