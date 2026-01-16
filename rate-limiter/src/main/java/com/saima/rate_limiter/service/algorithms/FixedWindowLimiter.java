package com.saima.rate_limiter.service.algorithms;

import com.saima.rate_limiter.model.RateLimitAlgorithm;
import com.saima.rate_limiter.model.RateLimitConfig;
import com.saima.rate_limiter.model.RateLimitMetrics;
import com.saima.rate_limiter.model.RateLimitResult;
import com.saima.rate_limiter.service.RateLimiter;
import com.saima.rate_limiter.store.InMemoryStore;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class FixedWindowLimiter implements RateLimiter {
    private final InMemoryStore store;
    private RateLimitConfig config;
    private final AtomicLong allowedCount = new AtomicLong(0);
    private final AtomicLong blockedCount = new AtomicLong(0);


    public FixedWindowLimiter(InMemoryStore store) {
        this.store = store;
    }

    @Override
    public void configure(RateLimitConfig config) {
        this.config = config;
    }

    @Override
    public RateLimitResult allowRequest(String clientId) {
        long windowMillis = config.getWindowSizeInSeconds() * 1000L;
        store.refreshWindow(windowMillis);

        AtomicInteger count = store.getCounter(clientId);
        int current = count.incrementAndGet();

        boolean allowed = current <= config.getLimit();

        if (allowed) {
            allowedCount.incrementAndGet();
        } else {
            blockedCount.incrementAndGet();
        }

        return new RateLimitResult(
                allowed,
                "FIXED_WINDOW",
                Math.max(0, config.getLimit() - current),
                allowed ? 0 : windowMillis,
                Map.of("currentCount", current)
        );
    }

    @Override
    public void reset() {
        store.reset();
        allowedCount.set(0);
        blockedCount.set(0);
    }

    @Override
    public RateLimitAlgorithm getAlgorithm() {
        return RateLimitAlgorithm.FIXED_WINDOW;
    }

    @Override
    public RateLimitMetrics getMetrics() {
        return new RateLimitMetrics(
                getAlgorithm(),
                allowedCount.get(),
                blockedCount.get(),
                getCurrentCount()
        );
    }

    private double getCurrentCount() {
        return store.getAllCounters()
                .values()
                .stream()
                .findFirst()
                .map(AtomicInteger::get)
                .orElse(0);
    }
}
