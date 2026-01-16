package com.saima.rate_limiter.model;

public class RateLimitMetrics {
    private RateLimitAlgorithm algorithm;
    private long allowedRequests;
    private long blockedRequests;
    private double remainingTokens;

    public RateLimitMetrics() {}

    public RateLimitMetrics(RateLimitAlgorithm algorithm,
                            long allowedRequests,
                            long blockedRequests,
                            double remainingTokens) {
        this.algorithm = algorithm;
        this.allowedRequests = allowedRequests;
        this.blockedRequests = blockedRequests;
        this.remainingTokens = remainingTokens;
    }

    public RateLimitAlgorithm getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(RateLimitAlgorithm algorithm) {
        this.algorithm = algorithm;
    }

    public long getAllowedRequests() {
        return allowedRequests;
    }

    public void setAllowedRequests(long allowedRequests) {
        this.allowedRequests = allowedRequests;
    }

    public long getBlockedRequests() {
        return blockedRequests;
    }

    public void setBlockedRequests(long blockedRequests) {
        this.blockedRequests = blockedRequests;
    }

    public double getRemainingTokens() {
        return remainingTokens;
    }

    public void setRemainingTokens(double remainingTokens) {
        this.remainingTokens = remainingTokens;
    }
}
