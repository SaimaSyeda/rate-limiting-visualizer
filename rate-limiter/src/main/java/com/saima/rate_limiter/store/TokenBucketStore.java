package com.saima.rate_limiter.store;

import com.saima.rate_limiter.model.TokenBucket;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenBucketStore {
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public TokenBucket getBucket(String clientId, int capacity) {
        return buckets.computeIfAbsent(clientId, k -> {
            TokenBucket bucket = new TokenBucket();
            bucket.setTokens(capacity);
            bucket.setLastRefillTimestamp(System.currentTimeMillis());
            return bucket;
        });
    }

    public Map<String, TokenBucket> getAllBuckets() {
        return buckets;
    }

    public void reset() {
        buckets.clear();
    }
}
