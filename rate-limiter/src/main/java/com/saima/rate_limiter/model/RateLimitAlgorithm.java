package com.saima.rate_limiter.model;

public enum RateLimitAlgorithm {
    FIXED_WINDOW,
    TOKEN_BUCKET,
    SLIDING_WINDOW_LOG,
    LEAKY_BUCKET
}
