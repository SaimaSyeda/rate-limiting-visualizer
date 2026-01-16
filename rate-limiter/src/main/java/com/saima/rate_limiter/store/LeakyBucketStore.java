package com.saima.rate_limiter.store;

import com.saima.rate_limiter.model.LeakyBucket;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LeakyBucketStore {
    private final Map<String, LeakyBucket> buckets = new ConcurrentHashMap<>();

    public LeakyBucket getBucket(String clientId) {
        return buckets.computeIfAbsent(
                clientId,
                id -> new LeakyBucket(0)
        );
    }

    public Map<String, LeakyBucket> getAllBuckets() {
        return buckets;
    }

    public void reset() {
        buckets.clear();
    }
}
