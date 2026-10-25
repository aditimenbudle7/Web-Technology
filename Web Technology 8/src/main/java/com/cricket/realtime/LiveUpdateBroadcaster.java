package com.cricket.realtime;

import com.cricket.dto.MatchSummaryDto;
import com.cricket.service.MatchService;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Pushes score changes to every connected browser using Server-Sent Events.
 * Clients subscribe once (GET /api/stream) and receive "score" events
 * instead of polling the REST API.
 */
@Component
public class LiveUpdateBroadcaster {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // browsers reconnect automatically

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public LiveUpdateBroadcaster(MatchService matchService) {
        matchService.addListener(this::broadcast);
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("hello").data("connected"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    public int connectedClients() {
        return emitters.size();
    }

    private void broadcast(List<MatchSummaryDto> updates) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("score").data(updates, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter); // client went away
            }
        }
    }

    /** Keeps idle connections open through proxies. */
    @Scheduled(fixedRate = 20000)
    public void heartbeat() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
    }
}
