package com.saima.rate_limiter.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
public class RateLimitResult {
    private boolean allowed;
    private String algorithm;
    private int remaining;
    private long retryAfterMillis;
    private Map<String, Object> metadata;

    public RateLimitResult(boolean allowed, String algorithm, int remaining, long retryAfterMillis, Map<String, Object> metadata) {
        this.allowed = allowed;
        this.algorithm = algorithm;
        this.remaining = remaining;
        this.retryAfterMillis = retryAfterMillis;
        this.metadata = metadata;
    }

    public boolean isAllowed() {
        return allowed;
    }

    public void setAllowed(boolean allowed) {
        this.allowed = allowed;
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public int getRemaining() {
        return remaining;
    }

    public void setRemaining(int remaining) {
        this.remaining = remaining;
    }

    public long getRetryAfterMillis() {
        return retryAfterMillis;
    }

    public void setRetryAfterMillis(long retryAfterMillis) {
        this.retryAfterMillis = retryAfterMillis;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
