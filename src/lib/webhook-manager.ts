/**
 * Webhook Manager - Manage GitHub webhooks and integrations
 */

export interface WebhookEvent {
  id: string;
  type: string;
  action?: string;
  repository: string;
  sender: string;
  timestamp: Date;
  payload: Record<string, any>;
}

export interface WebhookHandler {
  event: string;
  action?: string;
  handler: (event: WebhookEvent) => Promise<void> | void;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

export interface DeliveryStatus {
  id: string;
  webhookId: string;
  event: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  deliveredAt: Date;
  duration: number;
}

/**
 * Create webhook event from GitHub payload
 */
export function createWebhookEvent(payload: {
  action?: string;
  repository?: { full_name: string };
  sender?: { login: string };
  webhookId?: string;
}): WebhookEvent {
  return {
    id: payload.webhookId || `evt-${Date.now()}`,
    type: 'push',
    action: payload.action,
    repository: payload.repository?.full_name || 'unknown/repo',
    sender: payload.sender?.login || 'anonymous',
    timestamp: new Date(),
    payload
  };
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }
  const received = signature.slice(7);
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return received === expected;
}

/**
 * Parse webhook event type
 */
export function parseEventType(eventHeader: string): {
  event: string;
  action?: string;
} {
  const parts = eventHeader.split('.');
  return {
    event: parts[0] || 'unknown',
    action: parts[1]
  };
}

/**
 * Filter events by criteria
 */
export function filterEvents(
  events: WebhookEvent[],
  criteria: {
    repository?: string;
    sender?: string;
    type?: string;
    after?: Date;
    before?: Date;
  }
): WebhookEvent[] {
  return events.filter(event => {
    if (criteria.repository && event.repository !== criteria.repository) return false;
    if (criteria.sender && event.sender !== criteria.sender) return false;
    if (criteria.type && event.type !== criteria.type) return false;
    if (criteria.after && event.timestamp < criteria.after) return false;
    if (criteria.before && event.timestamp > criteria.before) return false;
    return true;
  });
}

/**
 * Get delivery statistics
 */
export function getDeliveryStats(deliveries: DeliveryStatus[]): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  recentFailures: DeliveryStatus[];
} {
  const successful = deliveries.filter(d => d.success).length;
  const failed = deliveries.filter(d => !d.success).length;
  const recentFailures = deliveries
    .filter(d => !d.success)
    .sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime())
    .slice(0, 10);
  const averageDuration = deliveries.length > 0
    ? deliveries.reduce((sum, d) => sum + d.duration, 0) / deliveries.length
    : 0;

  return {
    total: deliveries.length,
    successful,
    failed,
    successRate: deliveries.length > 0 ? Math.round((successful / deliveries.length) * 100) : 0,
    averageDuration: Math.round(averageDuration),
    recentFailures
  };
}

/**
 * Retry failed deliveries
 */
export function getRetryableEvents(
  deliveries: DeliveryStatus[],
  maxRetries = 3
): string[] {
  const retryCount = new Map<string, number>();
  
  deliveries.forEach(d => {
    if (!d.success) {
      retryCount.set(d.id, (retryCount.get(d.id) || 0) + 1);
    }
  });

  return Array.from(retryCount.entries())
    .filter(([_, count]) => count <= maxRetries)
    .map(([id]) => id);
}
