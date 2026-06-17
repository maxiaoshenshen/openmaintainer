export type WebhookEvent = 
  | 'push' | 'pull_request' | 'issues' | 'issue_comment'
  | 'release' | 'fork' | 'star' | 'watch'
  | 'create' | 'delete' | 'member' | 'public';

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  enabled: boolean;
  createdAt: Date;
  lastDeliveryAt?: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  response?: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  };
  createdAt: Date;
  deliveredAt?: Date;
}

export interface WebhookMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  deliveryRate: number;
}

export class WebhookManager {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery[]> = new Map();

  async createEndpoint(data: {
    url: string;
    events: WebhookEvent[];
    secret?: string;
  }): Promise<WebhookEndpoint> {
    const endpoint: WebhookEndpoint = {
      id: `WH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...data,
      enabled: true,
      createdAt: new Date(),
    };

    this.endpoints.set(endpoint.id, endpoint);
    this.deliveries.set(endpoint.id, []);
    return endpoint;
  }

  async updateEndpoint(id: string, updates: Partial<{
    url: string;
    events: WebhookEvent[];
    secret: string;
    enabled: boolean;
  }>): Promise<WebhookEndpoint | null> {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return null;

    Object.assign(endpoint, updates);
    return endpoint;
  }

  async deleteEndpoint(id: string): Promise<boolean> {
    return this.endpoints.delete(id) && this.deliveries.delete(id);
  }

  async getEndpoint(id: string): Promise<WebhookEndpoint | null> {
    return this.endpoints.get(id) || null;
  }

  async getAllEndpoints(): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values());
  }

  async triggerEvent(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    for (const endpoint of this.endpoints.values()) {
      if (!endpoint.enabled || !endpoint.events.includes(event)) continue;

      const delivery = await this.simulateDelivery(endpoint, event, payload);
      const deliveries = this.deliveries.get(endpoint.id) || [];
      deliveries.push(delivery);
      this.deliveries.set(endpoint.id, deliveries);
      endpoint.lastDeliveryAt = new Date();
    }
  }

  private async simulateDelivery(
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      webhookId: endpoint.id,
      event,
      payload,
      status: 'pending',
      attempts: 1,
      createdAt: new Date(),
    };

    // Simulate delivery (in real implementation, this would make HTTP request)
    const success = Math.random() > 0.1;
    
    delivery.status = success ? 'success' : 'failed';
    delivery.deliveredAt = new Date();
    delivery.response = {
      statusCode: success ? 200 : 500,
      body: success ? '{"ok":true}' : '{"error":"Internal error"}',
      headers: { 'content-type': 'application/json' },
    };

    return delivery;
  }

  async getDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    const deliveries = this.deliveries.get(webhookId) || [];
    return deliveries.slice(-limit);
  }

  async retryDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery | null> {
    const deliveries = this.deliveries.get(webhookId) || [];
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery || delivery.status !== 'failed') return null;

    delivery.attempts += 1;
    delivery.status = 'retrying';

    // Simulate retry
    const success = Math.random() > 0.3;
    delivery.status = success ? 'success' : 'failed';
    delivery.deliveredAt = new Date();
    delivery.response = {
      statusCode: success ? 200 : 500,
      body: success ? '{"ok":true}' : '{"error":"Still failing"}',
      headers: { 'content-type': 'application/json' },
    };

    return delivery;
  }

  async getMetrics(webhookId?: string): Promise<WebhookMetrics | Record<string, WebhookMetrics>> {
    const endpointIds = webhookId ? [webhookId] : Array.from(this.endpoints.keys());

    const getMetricsForEndpoint = (id: string): WebhookMetrics => {
      const deliveries = this.deliveries.get(id) || [];
      const successful = deliveries.filter(d => d.status === 'success').length;
      const failed = deliveries.filter(d => d.status === 'failed').length;

      return {
        totalDeliveries: deliveries.length,
        successfulDeliveries: successful,
        failedDeliveries: failed,
        averageResponseTime: 150 + Math.random() * 100, // Simulated
        deliveryRate: deliveries.length > 0 ? successful / deliveries.length : 0,
      };
    };

    if (webhookId) {
      return getMetricsForEndpoint(webhookId);
    }

    const result: Record<string, WebhookMetrics> = {};
    for (const id of endpointIds) {
      result[id] = getMetricsForEndpoint(id);
    }
    return result;
  }

  async testEndpoint(id: string): Promise<WebhookDelivery | null> {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return null;

    const delivery = await this.simulateDelivery(endpoint, 'push', {
      action: 'test',
      repository: { name: 'test-repo', full_name: 'test/test-repo' },
    });

    const deliveries = this.deliveries.get(id) || [];
    deliveries.push(delivery);
    this.deliveries.set(id, deliveries);
    endpoint.lastDeliveryAt = new Date();

    return delivery;
  }
}
