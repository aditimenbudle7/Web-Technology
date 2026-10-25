package com.cricket.model;

import java.time.Instant;

public record Commentary(String over, String text, CommentaryType type, Instant time) {
}
