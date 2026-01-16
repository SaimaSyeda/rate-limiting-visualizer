package com.saima.rate_limiter.store;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class InMemoryStore {
    private final Map<String, AtomicInteger> counter = new ConcurrentHashMap<>();
    private volatile long windowStart = System.currentTimeMillis();

    public AtomicInteger getCounter(String key) {
        return counter.computeIfAbsent(key, k -> new AtomicInteger(0));
    }

    public Map<String, AtomicInteger> getAllCounters() {
        return counter;
    }

    public void reset() {
        counter.clear();
        windowStart = System.currentTimeMillis();
    }

    public long getWindowStart() {
        return windowStart;
    }

    public void refreshWindow(long windowSizeMillis) {
        if (System.currentTimeMillis() - windowStart >= windowSizeMillis) {
            reset();
        }
    }
}
