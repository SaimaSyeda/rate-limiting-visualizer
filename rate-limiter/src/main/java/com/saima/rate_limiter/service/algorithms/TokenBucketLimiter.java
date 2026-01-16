package com.saima.rate_limiter.service.algorithms;

import com.saima.rate_limiter.model.*;
import com.saima.rate_limiter.service.RateLimiter;
import com.saima.rate_limiter.store.TokenBucketStore;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TokenBucketLimiter implements RateLimiter {

    private final TokenBucketStore store;
    private RateLimitConfig config;
    private final AtomicLong allowedCount = new AtomicLong(0);
    private final AtomicLong blockedCount = new AtomicLong(0);

    public TokenBucketLimiter(TokenBucketStore store) {
        this.store = store;
    }

    @Override
    public void configure(RateLimitConfig config) {
        this.config = config;
    }

    @Override
    public RateLimitResult allowRequest(String clientId) {
        TokenBucket bucket = store.getBucket(clientId, config.getCapacity());

        long now = System.currentTimeMillis();
        long elapsedMillis = now - bucket.getLastRefillTimestamp();

        double refillTokens =
                (elapsedMillis / 1000.0) * config.getRefillRate();

        double newTokenCount = Math.min(
                config.getCapacity(),
                bucket.getTokens() + refillTokens
        );

        bucket.setTokens(newTokenCount);
        bucket.setLastRefillTimestamp(now);

        boolean allowed;
        if (bucket.getTokens() >= 1) {
            bucket.setTokens(bucket.getTokens() - 1);
            allowed = true;
            allowedCount.incrementAndGet();
        } else {
            allowed = false;
            blockedCount.incrementAndGet();
        }

        return new RateLimitResult(
                allowed,
                "TOKEN_BUCKET",
                (int) bucket.getTokens(),
                allowed ? 0 : 1000,
                Map.of(
                        "tokens", bucket.getTokens(),
                        "capacity", config.getCapacity(),
                        "refillRate", config.getRefillRate()
                )
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
        return RateLimitAlgorithm.TOKEN_BUCKET;
    }

    @Override
    public RateLimitMetrics getMetrics() {
        return new RateLimitMetrics(
                getAlgorithm(),
                allowedCount.get(),
                blockedCount.get(),
                getLatestTokens()
        );
    }

    private double getLatestTokens() {
        return store.getAllBuckets()
                .values()
                .stream()
                .findFirst()
                .map(TokenBucket::getTokens)
                .orElse(0.0);
    }
}
