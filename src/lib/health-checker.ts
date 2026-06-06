// Health Checker for OpenMaintainer
// Monitors system health and external API availability

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
  lastChecked: Date;
}

export interface HealthReport {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  checks: HealthCheckResult[];
  uptime: number;
}

class HealthChecker {
  private lastCheck: Map<string, HealthCheckResult> = new Map();
  private startTime = Date.now();

  async checkGitHubAPI(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const response = await fetch('https://api.github.com/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const latency = performance.now() - start;

      return {
        service: 'github_api',
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        message: response.ok ? 'GitHub API is responsive' : 'GitHub API returned non-200 status',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        service: 'github_api',
        status: 'down',
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
      };
    }
  }

  async checkVercelAPI(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const response = await fetch('https://api.vercel.com/v1/health', {
        method: 'GET',
      });
      const latency = performance.now() - start;

      return {
        service: 'vercel_api',
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        message: 'Vercel API is responsive',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        service: 'vercel_api',
        status: 'down',
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
      };
    }
  }

  async checkOpenAIIAPI(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer placeholder' },
      });
      const latency = performance.now() - start;

      // 401 is expected without valid token, but API is reachable
      const status = response.status === 401 ? 'healthy' : response.ok ? 'healthy' : 'degraded';
      return {
        service: 'openai_api',
        status,
        latency,
        message: response.status === 401 ? 'OpenAI API is reachable (auth required)' : 'OpenAI API is responsive',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        service: 'openai_api',
        status: 'down',
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
      };
    }
  }

  checkLocalServer(port = 3000): HealthCheckResult {
    const start = performance.now();
    // This is a sync check for demo purposes
    return {
      service: 'local_server',
      status: 'healthy', // Would check actual server in production
      latency: performance.now() - start,
      message: `Local server on port ${port}`,
      lastChecked: new Date(),
    };
  }

  async runAllChecks(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.checkGitHubAPI(),
      this.checkVercelAPI(),
      this.checkOpenAIIAPI(),
    ]);

    const downCount = checks.filter((c) => c.status === 'down').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downCount > 0) overall = 'down';
    else if (degradedCount > 0) overall = 'degraded';

    checks.forEach((check) => {
      this.lastCheck.set(check.service, check);
    });

    return {
      overall,
      timestamp: new Date(),
      checks,
      uptime: Date.now() - this.startTime,
    };
  }

  getLastCheck(service: string): HealthCheckResult | undefined {
    return this.lastCheck.get(service);
  }

  getUptime(): string {
    const ms = Date.now() - this.startTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

export const healthChecker = new HealthChecker();

export function createHealthChecker(): HealthChecker {
  return new HealthChecker();
}

export { HealthChecker };
