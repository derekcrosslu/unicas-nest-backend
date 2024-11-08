interface RateLimitConfig {
  ttl: number; // Time window in milliseconds
  limit: number; // Maximum requests per time window
}

export class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();

  constructor(private readonly config: RateLimitConfig) {}

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceReset = now - this.lastReset;

    // Reset counter if TTL has passed
    if (timeSinceReset >= this.config.ttl) {
      this.requests = 0;
      this.lastReset = now;
    }

    // Check if limit is reached
    if (this.requests >= this.config.limit) {
      const waitTime = this.config.ttl - timeSinceReset;
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        // Recursive call after waiting
        return this.checkLimit();
      }
    }

    // Increment request counter
    this.requests++;
  }

  async reset(): Promise<void> {
    this.requests = 0;
    this.lastReset = Date.now();
  }

  getCurrentUsage(): { requests: number; timeRemaining: number } {
    const now = Date.now();
    const timeRemaining = Math.max(0, this.config.ttl - (now - this.lastReset));
    return {
      requests: this.requests,
      timeRemaining,
    };
  }

  isLimited(): boolean {
    return this.requests >= this.config.limit;
  }

  getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}
