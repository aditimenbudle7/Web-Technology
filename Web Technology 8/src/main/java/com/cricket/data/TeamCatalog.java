package com.cricket.data;

import com.cricket.model.Team;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

/** Fictional franchise teams with generated (fictional) player names. */
public final class TeamCatalog {

    private static final String[][] TEAMS = {
        {"Mumbai Mariners", "MUM", "#1e6fd9"},
        {"Chennai Chargers", "CHE", "#d9a400"},
        {"Delhi Dynamos", "DEL", "#d63a3a"},
        {"Bengaluru Blazers", "BLR", "#8a3ffc"},
        {"Hyderabad Hawks", "HYD", "#f07c1b"},
        {"Jaipur Jaguars", "JAI", "#e0569b"},
        {"Pune Panthers", "PUN", "#16a085"},
        {"Lucknow Lions", "LKO", "#2c5d8f"},
        {"Kochi Comets", "KOC", "#3fa34d"},
        {"Ahmedabad Arrows", "AHM", "#7a5c3e"},
    };

    private static final String[] FIRST = {
        "Aarav", "Vihaan", "Arjun", "Kabir", "Rohan", "Ishaan", "Dev", "Aditya", "Kunal", "Siddharth",
        "Yash", "Pranav", "Rahul", "Nikhil", "Varun", "Harsh", "Karthik", "Manav", "Rishi", "Tanmay",
        "Omkar", "Sameer", "Aniket", "Gaurav", "Ritesh", "Mihir", "Neel", "Parth", "Shaurya", "Vedant",
        "Ayaan", "Dhruv", "Atharv", "Kian", "Reyansh", "Laksh", "Sahil", "Tejas", "Uday", "Zaid",
    };

    private static final String[] LAST = {
        "Sharma", "Iyer", "Patil", "Reddy", "Nair", "Menon", "Kulkarni", "Deshmukh", "Joshi", "Rao",
        "Bose", "Chauhan", "Malhotra", "Saxena", "Pillai", "Bhat", "Gill", "Thakur", "Pandey", "Kapoor",
        "Shetty", "Naidu", "Mishra", "Verma", "Khanna", "Sethi", "Dutta", "Ghosh", "Kamath", "Agarwal",
    };

    private TeamCatalog() {
    }

    public static List<Team> createTeams(Random random) {
        Set<String> used = new HashSet<>();
        List<Team> teams = new ArrayList<>();
        for (String[] t : TEAMS) {
            List<String> players = new ArrayList<>();
            while (players.size() < 11) {
                String name = FIRST[random.nextInt(FIRST.length)].charAt(0) + ". " + LAST[random.nextInt(LAST.length)];
                String full = FIRST[random.nextInt(FIRST.length)] + " " + LAST[random.nextInt(LAST.length)];
                String chosen = random.nextDouble() < 0.5 ? name : full;
                if (used.add(chosen)) players.add(chosen);
            }
            teams.add(new Team(t[0], t[1], t[2], Collections.unmodifiableList(players)));
        }
        return Collections.unmodifiableList(teams);
    }

    public static final List<String> VENUES = List.of(
        "Marine Drive Stadium, Mumbai",
        "Coastal Oval, Chennai",
        "Capital Cricket Ground, Delhi",
        "Garden City Arena, Bengaluru",
        "Deccan Park, Hyderabad",
        "Pink City Stadium, Jaipur",
        "Sahyadri Ground, Pune",
        "Gomti Arena, Lucknow",
        "Backwaters Oval, Kochi",
        "Sabarmati Stadium, Ahmedabad"
    );
}
