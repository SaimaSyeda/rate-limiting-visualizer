package com.saima.rate_limiter.controller;

import com.saima.rate_limiter.model.RateLimitConfig;
import com.saima.rate_limiter.model.RateLimitMetrics;
import com.saima.rate_limiter.model.RateLimitResult;
import com.saima.rate_limiter.service.RateLimiterManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RateLimiterController {
    private final RateLimiterManager manager;

    public RateLimiterController(RateLimiterManager manager) {
        this.manager = manager;
    }

    @PostMapping("/config")
    public ResponseEntity<String> configure(@RequestBody RateLimitConfig config) {
        manager.configure(config);
        return ResponseEntity.ok("Configured successfully");
    }

    @PostMapping("/request")
    public ResponseEntity<RateLimitResult> request(@RequestParam String clientId) {
        RateLimitResult result = manager.handle(clientId);

        if (!result.isAllowed()) {
            return ResponseEntity.status(429).body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/metrics")
    public RateLimitMetrics metrics() {
        return manager.getMetrics();
    }
}
