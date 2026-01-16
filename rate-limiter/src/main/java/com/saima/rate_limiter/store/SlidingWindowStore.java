package com.saima.rate_limiter.store;

import org.springframework.stereotype.Component;

import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class SlidingWindowStore {

    private final Map<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    public Deque<Long> getLog(String clientId) {
        return requestLog.computeIfAbsent(clientId, k -> new ConcurrentLinkedDeque<>());
    }

    public Map<String, Deque<Long>> getAllLogs() {
        return requestLog;
    }

    public void reset() {
        requestLog.clear();
    }
}
