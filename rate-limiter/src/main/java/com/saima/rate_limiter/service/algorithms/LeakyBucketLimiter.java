package com.saima.rate_limiter.service.algorithms;

import com.saima.rate_limiter.model.*;
import com.saima.rate_limiter.service.RateLimiter;
import com.saima.rate_limiter.store.LeakyBucketStore;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;


@Service
public class LeakyBucketLimiter implements RateLimiter {

    private final LeakyBucketStore store;
    private RateLimitConfig config;

    private final AtomicLong allowedCount = new AtomicLong(0);
    private final AtomicLong blockedCount = new AtomicLong(0);

    public LeakyBucketLimiter(LeakyBucketStore store) {
        this.store = store;
    }

    @Override
    public RateLimitResult allowRequest(String clientId) {
        LeakyBucket bucket = store.getBucket(clientId);

        long now = System.currentTimeMillis();
        long elapsed = now - bucket.getLastLeakTimestamp();

        // leakRate = requests per second
        int leakedRequests = (int) ((elapsed / 1000.0) * config.getRefillRate());

        if (leakedRequests > 0) {
            bucket.setCurrentSize(
                    Math.max(0, bucket.getCurrentSize() - leakedRequests)
            );
            bucket.setLastLeakTimestamp(now);
        }

        boolean allowed;
        if (bucket.getCurrentSize() < config.getCapacity()) {
            bucket.setCurrentSize(bucket.getCurrentSize() + 1);
            allowed = true;
            allowedCount.incrementAndGet();
        } else {
            allowed = false;
            blockedCount.incrementAndGet();
        }

        return new RateLimitResult(
                allowed,
                "LEAKY_BUCKET",
                Math.max(0, config.getCapacity() - bucket.getCurrentSize()),
                allowed ? 0 : 1000,
                Map.of(
                        "currentSize", bucket.getCurrentSize(),
                        "capacity", config.getCapacity(),
                        "leakRate", config.getRefillRate()
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
        return RateLimitAlgorithm.LEAKY_BUCKET;
    }

    @Override
    public RateLimitMetrics getMetrics() {
        int size = store.getAllBuckets()
                .values()
                .stream()
                .findFirst()
                .map(LeakyBucket::getCurrentSize)
                .orElse(0);

        return new RateLimitMetrics(
                getAlgorithm(),
                allowedCount.get(),
                blockedCount.get(),
                size
        );
    }
}
