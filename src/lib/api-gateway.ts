/**
 * API Gateway - Rate limiting, authentication, and request routing
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: RequestContext) => string;
}

export interface RequestContext {
  id: string;
  path: string;
  method: string;
  ip: string;
  userId?: string;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export interface RouteConfig {
  path: string;
  method: string;
  handler: string;
  authRequired: boolean;
  rateLimit?: RateLimitConfig;
  cacheTtl?: number;
}

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: Date;
  scopes: string[];
}

export interface Middleware {
  name: string;
  handler: (ctx: RequestContext) => boolean | Promise<boolean>;
  order: number;
}

export class APIGateway {
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private routes: Map<string, RouteConfig> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private middlewares: Middleware[] = [];
  private requestLog: RequestContext[] = [];
  private config: { globalRateLimit?: RateLimitConfig; corsOrigins?: string[] };

  constructor(config?: { globalRateLimit?: RateLimitConfig; corsOrigins?: string[] }) {
    this.config = config || {};
  }

  addRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
  }

  getRoute(method: string, path: string): RouteConfig | undefined {
    return this.routes.get(`${method}:${path}`);
  }

  listRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  removeRoute(method: string, path: string): boolean {
    return this.routes.delete(`${method}:${path}`);
  }

  checkRateLimit(ctx: RequestContext, config?: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const rateLimitConfig = config || this.config.globalRateLimit;
    if (!rateLimitConfig) {
      return { allowed: true, remaining: -1, resetAt: 0 };
    }

    const key = rateLimitConfig.keyGenerator ? rateLimitConfig.keyGenerator(ctx) : ctx.ip;
    const entry = this.rateLimits.get(key) || {
      count: 0,
      resetTime: Date.now() + rateLimitConfig.windowMs,
      blocked: false
    };

    if (Date.now() > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = Date.now() + rateLimitConfig.windowMs;
      entry.blocked = false;
    }

    if (entry.blocked) {
      return { allowed: false, remaining: 0, resetAt: entry.resetTime };
    }

    if (entry.count >= rateLimitConfig.maxRequests) {
      entry.blocked = true;
      this.rateLimits.set(key, entry);
      return { allowed: false, remaining: 0, resetAt: entry.resetTime };
    }

    entry.count++;
    this.rateLimits.set(key, entry);

    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - entry.count,
      resetAt: entry.resetTime
    };
  }

  generateToken(userId: string, scopes: string[], expiresIn: number): AuthToken {
    const token: AuthToken = {
      token: `tok_${Math.random().toString(36).substr(2, 16)}`,
      userId,
      expiresAt: new Date(Date.now() + expiresIn),
      scopes
    };
    this.tokens.set(token.token, token);
    return token;
  }

  validateToken(token: string): AuthToken | null {
    const authToken = this.tokens.get(token);
    if (!authToken) return null;
    if (authToken.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }
    return authToken;
  }

  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  revokeAllUserTokens(userId: string): number {
    let revoked = 0;
    for (const [token, authToken] of this.tokens.entries()) {
      if (authToken.userId === userId) {
        this.tokens.delete(token);
        revoked++;
      }
    }
    return revoked;
  }

  addMiddleware(middleware: Middleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.order - b.order);
  }

  removeMiddleware(name: string): boolean {
    const index = this.middlewares.findIndex(m => m.name === name);
    if (index === -1) return false;
    this.middlewares.splice(index, 1);
    return true;
  }

  async executeMiddlewares(ctx: RequestContext): Promise<{ success: boolean; error?: string }> {
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware.handler(ctx);
        if (!result) {
          return { success: false, error: `Middleware '${middleware.name}' rejected request` };
        }
      } catch (e) {
        return { success: false, error: `Middleware '${middleware.name}' error: ${e}` };
      }
    }
    return { success: true };
  }

  logRequest(ctx: RequestContext): void {
    this.requestLog.push(ctx);
    if (this.requestLog.length > 10000) {
      this.requestLog.shift();
    }
  }

  getRequestLog(filters?: { userId?: string; path?: string; limit?: number }): RequestContext[] {
    let logs = [...this.requestLog];
    if (filters?.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters?.path) {
      logs = logs.filter(l => l.path.includes(filters.path));
    }
    logs.reverse();
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }
    return logs;
  }

  getStatistics(): {
    totalRequests: number;
    requestsByPath: Record<string, number>;
    requestsByMethod: Record<string, number>;
    uniqueUsers: number;
    activeTokens: number;
    rateLimitedRequests: number;
  } {
    const requestsByPath: Record<string, number> = {};
    const requestsByMethod: Record<string, number> = {};
    const users = new Set<string>();

    for (const ctx of this.requestLog) {
      requestsByPath[ctx.path] = (requestsByPath[ctx.path] || 0) + 1;
      requestsByMethod[ctx.method] = (requestsByMethod[ctx.method] || 0) + 1;
      if (ctx.userId) users.add(ctx.userId);
    }

    let rateLimited = 0;
    for (const entry of this.rateLimits.values()) {
      if (entry.blocked) rateLimited++;
    }

    return {
      totalRequests: this.requestLog.length,
      requestsByPath,
      requestsByMethod,
      uniqueUsers: users.size,
      activeTokens: this.tokens.size,
      rateLimitedRequests: rateLimited
    };
  }

  clearRateLimits(): void {
    this.rateLimits.clear();
  }

  clearLogs(): void {
    this.requestLog = [];
  }
}

export const createAPIGateway = (config?: APIGateway['config']) => new APIGateway(config);
