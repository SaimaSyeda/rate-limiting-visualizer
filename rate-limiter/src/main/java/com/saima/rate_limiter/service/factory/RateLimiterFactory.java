package com.saima.rate_limiter.service.factory;

import com.saima.rate_limiter.model.RateLimitAlgorithm;
import com.saima.rate_limiter.service.RateLimiter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class RateLimiterFactory {

    private final Map<RateLimitAlgorithm, RateLimiter> limiterMap;

    public RateLimiterFactory(List<RateLimiter> limiters) {
        this.limiterMap = limiters.stream()
                .collect(Collectors.toMap(
                        RateLimiter::getAlgorithm,
                        limiter -> limiter
                ));
        System.out.println("Loaded limiters: " + limiterMap.keySet());
    }

    public RateLimiter getLimiter(String algorithm) {
        RateLimitAlgorithm algo;

        try {
            algo = RateLimitAlgorithm.valueOf(algorithm.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid algorithm: " + algorithm);
        }

        RateLimiter limiter = limiterMap.get(algo);

        if (limiter == null) {
            throw new IllegalStateException("No limiter found for algorithm: " + algo);
        }

        return limiter;
    }
}
