/**
 * Webhook Handler
 * Process and handle GitHub webhook events in real-time
 */

export type WebhookEvent = 
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'commit_comment'
  | 'create'
  | 'delete'
  | 'release'
  | 'star'
  | 'fork'
  | 'watch'
  | 'member'
  | 'repository';

export interface WebhookPayload {
  action?: string;
  sender: {
    login: string;
    id: number;
    type: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  [key: string]: unknown;
}

export interface WebhookEventHandler {
  event: WebhookEvent;
  handler: (payload: WebhookPayload) => Promise<void> | void;
}

export interface WebhookConfig {
  secret?: string;
  handlers: WebhookEventHandler[];
}

export interface ProcessedEvent {
  id: string;
  event: WebhookEvent;
  action?: string;
  sender: string;
  repository: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return true;
  
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Parse webhook payload
 */
export function parseWebhookPayload(event: string, payload: WebhookPayload): ProcessedEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    event: event as WebhookEvent,
    action: payload.action,
    sender: payload.sender.login,
    repository: payload.repository.full_name,
    timestamp: new Date(),
    data: payload as Record<string, unknown>,
  };
}

/**
 * Create a webhook server
 */
export function createWebhookServer(config: WebhookConfig) {
  const processedEvents: ProcessedEvent[] = [];
  const handlers = new Map<WebhookEvent, WebhookEventHandler['handler'][]>();
  
  // Register handlers
  for (const { event, handler } of config.handlers) {
    const existing = handlers.get(event) || [];
    existing.push(handler);
    handlers.set(event, existing);
  }
  
  return {
    /**
     * Process incoming webhook
     */
    async process(event: string, payload: WebhookPayload): Promise<ProcessedEvent | null> {
      const processed = parseWebhookPayload(event, payload);
      processedEvents.push(processed);
      
      const eventHandlers = handlers.get(processed.event);
      if (eventHandlers) {
        await Promise.all(eventHandlers.map(h => h(payload)));
      }
      
      return processed;
    },
    
    /**
     * Get all processed events
     */
    getEvents(limit?: number): ProcessedEvent[] {
      const events = [...processedEvents].reverse();
      return limit ? events.slice(0, limit) : events;
    },
    
    /**
     * Get events by type
     */
    getEventsByType(event: WebhookEvent): ProcessedEvent[] {
      return processedEvents.filter(e => e.event === event);
    },
    
    /**
     * Get events by repository
     */
    getEventsByRepo(repo: string): ProcessedEvent[] {
      return processedEvents.filter(e => e.repository === repo);
    },
    
    /**
     * Clear event history
     */
    clearHistory(): void {
      processedEvents.length = 0;
    },
  };
}

/**
 * GitHub Actions webhook events
 */
export interface GitHubActionsEvent {
  workflow: string;
  run_id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  actor: string;
  repository: string;
  timestamp: Date;
}

/**
 * Process GitHub Actions workflow events
 */
export function processWorkflowEvent(payload: WebhookPayload): GitHubActionsEvent | null {
  const workflowJob = payload.workflow_job || payload.workflow_run;
  if (!workflowJob) return null;
  
  return {
    workflow: (payload.workflow || workflowJob.name) as string,
    run_id: workflowJob.id as number,
    status: workflowJob.status as 'queued' | 'in_progress' | 'completed',
    conclusion: workflowJob.conclusion as 'success' | 'failure' | 'cancelled' | 'skipped' | undefined,
    actor: payload.sender?.login || 'unknown',
    repository: payload.repository?.full_name || 'unknown',
    timestamp: new Date(),
  };
}

/**
 * Format webhook event for notification
 */
export function formatWebhookNotification(event: ProcessedEvent): string {
  const action = event.action || 'triggered';
  const repo = event.repository.split('/').pop();
  
  switch (event.event) {
    case 'push':
      return `🚀 ${repo}: New push to repository`;
    case 'pull_request':
      return `📝 ${repo}: PR ${action}`;
    case 'issues':
      return `🐛 ${repo}: Issue ${action}`;
    case 'issue_comment':
      return `💬 ${repo}: New comment`;
    case 'release':
      return `🎉 ${repo}: Release ${action}`;
    case 'star':
      return `⭐ ${repo}: ${event.sender} ${action === 'created' ? 'starred' : 'unstarred'}`;
    case 'fork':
      return `🍴 ${repo}: Forked by ${event.sender}`;
    default:
      return `📬 ${repo}: ${event.event} event ${action}`;
  }
}
