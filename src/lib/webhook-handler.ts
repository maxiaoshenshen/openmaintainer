// GitHub Webhook Handler for OpenMaintainer
// Processes incoming webhooks for real-time updates

export type WebhookEventType = 
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'create'
  | 'delete'
  | 'release'
  | 'star'
  | 'fork'
  | 'member'
  | 'workflow_run';

export interface WebhookPayload {
  action: string;
  sender: {
    login: string;
    avatar_url: string;
    type: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    default_branch: string;
  };
  [key: string]: any;
}

export interface WebhookEvent {
  type: WebhookEventType;
  action: string;
  repository: string;
  sender: string;
  timestamp: Date;
  data: WebhookPayload;
}

export interface WebhookHandlerConfig {
  secret?: string;
  events?: WebhookEventType[];
  onEvent?: (event: WebhookEvent) => void | Promise<void>;
}

class WebhookHandler {
  private secret?: string;
  private events: Set<WebhookEventType>;
  private handlers: Map<WebhookEventType, (event: WebhookEvent) => void | Promise<void>> = new Map();

  constructor(config: WebhookHandlerConfig = {}) {
    this.secret = config.secret;
    this.events = new Set(config.events || ['push', 'pull_request', 'issues', 'release']);
    if (config.onEvent) {
      this.on('*', config.onEvent);
    }
  }

  verifySignature(payload: string, signature: string): boolean {
    if (!this.secret) return true;
    
    // GitHub webhook signature format: sha256=<hash>
    const expectedSignature = `sha256=${this.createHMAC(payload)}`;
    return this.secureCompare(expectedSignature, signature);
  }

  private createHMAC(payload: string): string {
    // Simple HMAC-SHA256 simulation for demonstration
    // In production, use Node.js crypto module
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const key = encoder.encode(this.secret || '');
    
    // This is a simplified version - production should use crypto.createHmac
    let hash = 0;
    const combined = payload + (this.secret || '');
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  parseEvent(headers: Record<string, string>, payload: string): WebhookEvent | null {
    const eventType = headers['x-github-event'] as WebhookEventType;
    const deliveryId = headers['x-github-delivery'];
    
    if (!eventType) return null;
    if (!this.events.has(eventType)) return null;

    let data: WebhookPayload;
    try {
      data = JSON.parse(payload);
    } catch {
      return null;
    }

    return {
      type: eventType,
      action: data.action || 'unknown',
      repository: data.repository?.full_name || 'unknown',
      sender: data.sender?.login || 'unknown',
      timestamp: new Date(),
      data,
    };
  }

  on(event: WebhookEventType | '*', handler: (event: WebhookEvent) => void | Promise<void>): void {
    this.handlers.set(event, handler);
  }

  async handle(event: WebhookEvent): Promise<void> {
    const handler = this.handlers.get(event.type) || this.handlers.get('*');
    if (handler) {
      await handler(event);
    }
  }

  extractInsights(event: WebhookEvent): {
    type: string;
    summary: string;
    priority: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  } {
    const { type, action, data, sender, repository } = event;
    const insights: Record<WebhookEventType, () => any> = {
      push: () => ({
        type: 'code',
        summary: `${data.commits?.length || 0} commits pushed to ${data.ref}`,
        priority: 'low',
        actionRequired: false,
      }),
      pull_request: () => ({
        type: 'review',
        summary: `PR #${data.pull_request?.number}: ${data.pull_request?.title} (${action})`,
        priority: data.action === 'opened' ? 'high' : 'medium',
        actionRequired: data.action === 'opened',
      }),
      issues: () => ({
        type: 'issue',
        summary: `Issue #${data.issue?.number}: ${data.issue?.title} (${action})`,
        priority: data.action === 'opened' ? 'high' : 'low',
        actionRequired: data.action === 'opened',
      }),
      issue_comment: () => ({
        type: 'engagement',
        summary: `New comment on ${data.issue ? `issue #${data.issue.number}` : 'PR'}`,
        priority: 'medium',
        actionRequired: false,
      }),
      release: () => ({
        type: 'milestone',
        summary: `Release ${data.release?.tag_name} ${action}`,
        priority: 'high',
        actionRequired: data.action === 'published',
      }),
      star: () => ({
        type: 'growth',
        summary: `Repository ${action === 'created' ? 'received a star' : 'lost a star'}`,
        priority: 'low',
        actionRequired: false,
      }),
      fork: () => ({
        type: 'growth',
        summary: `Repository forked by ${sender}`,
        priority: 'low',
        actionRequired: false,
      }),
      create: () => ({
        type: 'structure',
        summary: `New ${data.ref_type} created: ${data.ref}`,
        priority: 'low',
        actionRequired: false,
      }),
      delete: () => ({
        type: 'structure',
        summary: `${data.ref_type} deleted: ${data.ref}`,
        priority: 'medium',
        actionRequired: true,
      }),
      member: () => ({
        type: 'collaboration',
        summary: `${sender} ${action} as a collaborator`,
        priority: 'medium',
        actionRequired: action === 'added',
      }),
      workflow_run: () => ({
        type: 'automation',
        summary: `Workflow "${data.workflow_run?.name}" ${action}`,
        priority: data.action === 'completed' && data.workflow_run?.conclusion === 'failure' ? 'high' : 'low',
        actionRequired: data.action === 'completed' && data.workflow_run?.conclusion === 'failure',
      }),
    };

    const extractor = insights[type];
    if (extractor) {
      return extractor();
    }

    return {
      type: 'unknown',
      summary: `Unknown event: ${type}`,
      priority: 'low',
      actionRequired: false,
    };
  }
}

export function createWebhookHandler(config?: WebhookHandlerConfig): WebhookHandler {
  return new WebhookHandler(config);
}

export { WebhookHandler };
