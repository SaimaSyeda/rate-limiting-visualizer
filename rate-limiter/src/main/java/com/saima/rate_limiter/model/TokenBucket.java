package com.saima.rate_limiter.model;

import lombok.Data;

@Data
public class TokenBucket {
    private double tokens;
    private long lastRefillTimestamp;

    public double getTokens() {
        return tokens;
    }

    public void setTokens(double tokens) {
        this.tokens = tokens;
    }

    public long getLastRefillTimestamp() {
        return lastRefillTimestamp;
    }

    public void setLastRefillTimestamp(long lastRefillTimestamp) {
        this.lastRefillTimestamp = lastRefillTimestamp;
    }
}
