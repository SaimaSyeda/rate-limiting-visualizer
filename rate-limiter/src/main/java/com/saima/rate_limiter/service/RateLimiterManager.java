package com.saima.rate_limiter.service;

import com.saima.rate_limiter.model.RateLimitConfig;
import com.saima.rate_limiter.model.RateLimitMetrics;
import com.saima.rate_limiter.model.RateLimitResult;
import com.saima.rate_limiter.service.factory.RateLimiterFactory;
import org.springframework.stereotype.Service;

@Service
public class RateLimiterManager {
    private final RateLimiterFactory factory;
    private RateLimiter activeLimiter;

    public RateLimiterManager(RateLimiterFactory factory) {
        this.factory = factory;
    }

    public synchronized void configure(RateLimitConfig config) {
        this.activeLimiter = factory.getLimiter(config.getAlgorithm());
        this.activeLimiter.configure(config);
        this.activeLimiter.reset();
    }

    public RateLimitResult handle(String clientId) {
        if (activeLimiter == null) {
            throw new IllegalStateException("Rate limiter not configured");
        }
        return activeLimiter.allowRequest(clientId);
    }

    public RateLimitMetrics getMetrics() {
        if (activeLimiter == null) {
            return new RateLimitMetrics(null, 0, 0, 0);
        }
        return activeLimiter.getMetrics();
    }
}
