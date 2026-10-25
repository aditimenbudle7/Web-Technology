package com.cricket.web;

import com.cricket.realtime.LiveUpdateBroadcaster;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class StreamController {

    private final LiveUpdateBroadcaster broadcaster;

    public StreamController(LiveUpdateBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    /** Server-Sent Events stream of live score updates. */
    @GetMapping(path = "/api/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return broadcaster.subscribe();
    }
}
