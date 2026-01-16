package com.saima.rate_limiter.model;

public class LeakyBucket {
    private int currentSize;
    private long lastLeakTimestamp;

    public LeakyBucket(int initialSize) {
        this.currentSize = initialSize;
        this.lastLeakTimestamp = System.currentTimeMillis();
    }

    public int getCurrentSize() {
        return currentSize;
    }

    public void setCurrentSize(int currentSize) {
        this.currentSize = currentSize;
    }

    public long getLastLeakTimestamp() {
        return lastLeakTimestamp;
    }

    public void setLastLeakTimestamp(long lastLeakTimestamp) {
        this.lastLeakTimestamp = lastLeakTimestamp;
    }
}
