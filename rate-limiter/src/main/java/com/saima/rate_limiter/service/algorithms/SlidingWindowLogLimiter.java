package com.saima.rate_limiter.service.algorithms;

import com.saima.rate_limiter.model.RateLimitAlgorithm;
import com.saima.rate_limiter.model.RateLimitConfig;
import com.saima.rate_limiter.model.RateLimitMetrics;
import com.saima.rate_limiter.model.RateLimitResult;
import com.saima.rate_limiter.service.RateLimiter;
import com.saima.rate_limiter.store.SlidingWindowStore;
import org.springframework.stereotype.Service;

import java.util.Deque;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class SlidingWindowLogLimiter implements RateLimiter {

    private final SlidingWindowStore store;
    private RateLimitConfig config;
    private final AtomicLong allowedCount = new AtomicLong(0);
    private final AtomicLong blockedCount = new AtomicLong(0);

    public SlidingWindowLogLimiter(SlidingWindowStore store) {
        this.store = store;
    }

    @Override
    public synchronized RateLimitResult allowRequest(String clientId) {
        Deque<Long> log = store.getLog(clientId);
        long now = System.currentTimeMillis();
        long windowMillis = config.getWindowSizeInSeconds() * 1000L;

        while (!log.isEmpty() && now - log.peekFirst() > windowMillis) {
            log.pollFirst();
        }

        boolean allowed;
        if (log.size() < config.getLimit()) {
            log.addLast(now);
            allowed = true;
            allowedCount.incrementAndGet();
        } else {
            allowed = false;
            blockedCount.incrementAndGet();
        }

        return new RateLimitResult(
                allowed,
                "SLIDING_WINDOW_LOG",
                Math.max(0, config.getLimit() - log.size()),
                allowed ? 0 : windowMillis,
                Map.of(
                        "currentWindowSize", log.size(),
                        "timestamps", log.size()
                )
        );
    }

    @Override
    public void configure(RateLimitConfig config) {
        this.config = config;
    }

    @Override
    public void reset() {
        store.reset();
        allowedCount.set(0);
        blockedCount.set(0);
    }

    @Override
    public RateLimitAlgorithm getAlgorithm() {
        return RateLimitAlgorithm.SLIDING_WINDOW_LOG;
    }

    @Override
    public RateLimitMetrics getMetrics() {
        return new RateLimitMetrics(
                getAlgorithm(),
                allowedCount.get(),
                blockedCount.get(),
                getCurrentWindowSize()
        );
    }

    private double getCurrentWindowSize() {
        return store.getAllLogs()
                .values()
                .stream()
                .findFirst()
                .map(Deque::size)
                .orElse(0);
    }
}
