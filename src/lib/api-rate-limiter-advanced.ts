interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class AdvancedRateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.startCleanup();
  }

  private startCleanup(): void {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
          if (entry.resetTime <= now) {
            this.limits.delete(key);
          }
        }
      }, this.config.windowMs);
    }
  }

  private defaultKeyGenerator(request: Request): string {
    return request.headers.get("x-forwarded-for") || 
           request.headers.get("x-real-ip") || 
           "anonymous";
  }

  private getKey(request: Request): string {
    return this.config.keyGenerator 
      ? this.config.keyGenerator(request) 
      : this.defaultKeyGenerator(request);
  }

  check(request: Request): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(request);
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || entry.resetTime <= now) {
      const resetTime = now + this.config.windowMs;
      this.limits.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
    }

    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { 
      allowed: true, 
      remaining: this.config.maxRequests - entry.count, 
      resetTime: entry.resetTime 
    };
  }

  reset(key?: string): void {
    if (key) {
      this.limits.delete(key);
    } else {
      this.limits.clear();
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Pre-configured limiters for different endpoints
export const standardLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

export const analysisLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // Heavy operation
});

export const authLimiter = new AdvancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Security sensitive
});

export { AdvancedRateLimiter };
