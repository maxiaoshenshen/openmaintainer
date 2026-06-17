import type { MaintainerAnalysis } from "./types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private accessOrder: string[] = [];

  private generateKey(repo: string, type: string): string {
    return `${type}:${repo}`;
  }

  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    this.accessOrder.push(key);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      return null;
    }

    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
    return entry.data;
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys()).filter((k) => k.includes(pattern));
    keys.forEach((key) => {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    });
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      entries: Array.from(this.cache.keys()),
    };
  }

  cacheAnalysis(repo: string, analysis: MaintainerAnalysis, ttl?: number): void {
    this.set(this.generateKey(repo, "analysis"), analysis, ttl);
  }

  getAnalysis(repo: string): MaintainerAnalysis | null {
    return this.get<MaintainerAnalysis>(this.generateKey(repo, "analysis"));
  }

  cacheRepository(repo: string, data: unknown, ttl?: number): void {
    this.set(this.generateKey(repo, "repo"), data, ttl);
  }

  getRepository(repo: string): unknown | null {
    return this.get(this.generateKey(repo, "repo"));
  }
}

export const cacheManager = new CacheManager();
export { CacheManager };
