package com.saima.rate_limiter.model;

import lombok.Data;

@Data
public class RateLimitConfig {
    private String algorithm;
    private int limit;
    private int windowSizeInSeconds;
    private int refillRate;
    private int capacity;

    public String getAlgorithm() {
        return algorithm;
    }

    public int getLimit() {
        return limit;
    }

    public int getWindowSizeInSeconds() {
        return windowSizeInSeconds;
    }

    public int getRefillRate() {
        return refillRate;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public void setWindowSizeInSeconds(int windowSizeInSeconds) {
        this.windowSizeInSeconds = windowSizeInSeconds;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public void setRefillRate(int refillRate) {
        this.refillRate = refillRate;
    }
}
