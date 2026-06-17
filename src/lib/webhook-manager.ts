/**
 * Webhook Manager - Manage and test GitHub webhooks
 */

export interface WebhookConfig {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
}

export type WebhookEvent = 
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'create'
  | 'delete'
  | 'release'
  | 'workflow_run'
  | 'star'
  | 'fork'
  | 'watch'
  | 'member'
  | 'public';

export interface WebhookDelivery {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  responseCode?: number;
  duration?: number;
  payload?: unknown;
  error?: string;
}

export interface WebhookLog {
  deliveries: WebhookDelivery[];
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  lastDelivery?: WebhookDelivery;
}

export interface WebhookTest {
  event: WebhookEvent;
  payload: unknown;
  expectedResponse?: {
    status: number;
    body?: string;
  };
  result?: 'passed' | 'failed' | 'skipped';
  actualResponse?: {
    status: number;
    duration: number;
    body?: string;
  };
}

// Simple hash function for tests (in production use crypto)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generate webhook payload for testing
 */
export function generateTestPayload(event: WebhookEvent): unknown {
  const basePayload = {
    action: 'opened',
    repository: {
      id: 123456789,
      full_name: 'owner/repo',
      name: 'repo',
      owner: {
        login: 'owner',
        id: 12345,
      },
      private: false,
      default_branch: 'main',
    },
    sender: {
      login: 'testuser',
      id: 67890,
    },
  };

  switch (event) {
    case 'push':
      return {
        ...basePayload,
        ref: 'refs/heads/main',
        before: 'abc123',
        after: 'def456',
        commits: [
          {
            id: 'def456',
            message: 'Test commit',
            author: { name: 'Test User', email: 'test@example.com' },
            timestamp: new Date().toISOString(),
          },
        ],
      };

    case 'pull_request':
      return {
        ...basePayload,
        action: 'opened',
        number: 42,
        pull_request: {
          id: 1,
          number: 42,
          title: 'Test PR',
          state: 'open',
          user: { login: 'testuser' },
          body: 'Test PR description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

    case 'issues':
      return {
        ...basePayload,
        action: 'opened',
        issue: {
          id: 1,
          number: 42,
          title: 'Test Issue',
          state: 'open',
          user: { login: 'testuser' },
          body: 'Test issue description',
          labels: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

    case 'release':
      return {
        ...basePayload,
        action: 'published',
        release: {
          id: 1,
          tag_name: 'v1.0.0',
          name: 'Version 1.0.0',
          draft: false,
          prerelease: false,
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        },
      };

    case 'workflow_run':
      return {
        ...basePayload,
        action: 'completed',
        workflow_run: {
          id: 1,
          name: 'CI',
          head_branch: 'main',
          status: 'completed',
          conclusion: 'success',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

    default:
      return basePayload;
  }
}

/**
 * Validate webhook payload structure
 */
export function validatePayload(event: WebhookEvent, payload: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }
  
  const p = payload as Record<string, unknown>;
  
  // Check required fields
  if (!p.repository) {
    errors.push('Missing required field: repository');
  }
  
  if (!p.sender) {
    errors.push('Missing required field: sender');
  }
  
  // Event-specific validation
  switch (event) {
    case 'push':
      if (!p.ref) errors.push('Push event requires ref field');
      if (!p.commits) errors.push('Push event requires commits field');
      break;
      
    case 'pull_request':
      if (!(p as { pull_request?: unknown }).pull_request) {
        errors.push('Pull request event requires pull_request field');
      }
      break;
      
    case 'issues':
      if (!(p as { issue?: unknown }).issue) {
        errors.push('Issues event requires issue field');
      }
      break;
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Create webhook configuration
 */
export function createWebhookConfig(config: {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}): WebhookConfig {
  return {
    url: config.url,
    events: config.events,
    secret: config.secret,
    active: true,
  };
}

/**
 * Generate webhook signature for verification
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: 'sha1' | 'sha256' = 'sha256'
): string {
  const combined = payload + secret;
  const hash = simpleHash(combined);
  
  // Pad to simulate hex string length
  const paddedHash = (hash + hash).slice(0, algorithm === 'sha1' ? 40 : 64);
  
  return `${algorithm === 'sha1' ? 'sha1=' : 'sha256='}${paddedHash}`;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split('=');
  if (parts.length !== 2) return false;
  
  const [alg, hash] = parts;
  const expected = generateWebhookSignature(payload, secret, alg as 'sha1' | 'sha256');
  
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Record webhook delivery
 */
export function recordDelivery(
  log: WebhookLog,
  delivery: Omit<WebhookDelivery, 'id' | 'timestamp'>
): WebhookLog {
  const newDelivery: WebhookDelivery = {
    ...delivery,
    id: `delivery-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
  
  const deliveries = [newDelivery, ...log.deliveries].slice(0, 100); // Keep last 100
  
  const successful = deliveries.filter(d => d.status === 'success').length;
  
  return {
    deliveries,
    totalRequests: log.totalRequests + 1,
    successRate: Math.round((successful / deliveries.length) * 100),
    averageResponseTime: calculateAverageResponseTime(deliveries),
    lastDelivery: newDelivery,
  };
}

function calculateAverageResponseTime(deliveries: WebhookDelivery[]): number {
  const withDuration = deliveries.filter(d => d.duration !== undefined);
  if (withDuration.length === 0) return 0;
  
  const sum = withDuration.reduce((acc, d) => acc + (d.duration || 0), 0);
  return Math.round(sum / withDuration.length);
}

/**
 * Analyze webhook performance
 */
export function analyzeWebhookPerformance(log: WebhookLog): {
  health: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (log.successRate < 80) {
    issues.push(`Low success rate: ${log.successRate}%`);
    recommendations.push('Check webhook endpoint availability and fix any errors');
  }
  
  if (log.averageResponseTime > 5000) {
    issues.push(`Slow response time: ${log.averageResponseTime}ms average`);
    recommendations.push('Optimize webhook handler or consider async processing');
  }
  
  const failed = log.deliveries.filter(d => d.status === 'failed');
  if (failed.length > 0) {
    const recentFailures = failed.slice(0, 3);
    issues.push(`${failed.length} failed deliveries in recent history`);
    recommendations.push('Review error logs and fix webhook endpoint issues');
    
    recentFailures.forEach(f => {
      if (f.error) issues.push(`Recent error: ${f.error.slice(0, 100)}`);
    });
  }
  
  const health = issues.length === 0 ? 'healthy'
    : issues.length <= 2 ? 'degraded'
    : 'unhealthy';
  
  return { health, issues, recommendations };
}
