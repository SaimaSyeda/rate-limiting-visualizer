package com.saima.rate_limiter.service;

import com.saima.rate_limiter.model.RateLimitAlgorithm;
import com.saima.rate_limiter.model.RateLimitConfig;
import com.saima.rate_limiter.model.RateLimitMetrics;
import com.saima.rate_limiter.model.RateLimitResult;

public interface RateLimiter {
    RateLimitResult allowRequest(String clientId);
    void configure(RateLimitConfig config);
    void reset();

    RateLimitAlgorithm getAlgorithm();
    RateLimitMetrics getMetrics();
}
