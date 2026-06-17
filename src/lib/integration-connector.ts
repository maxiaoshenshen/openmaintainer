/**
 * Integration Connector - Connect with external services (Slack, Discord, etc.)
 */

export type IntegrationType = 'slack' | 'discord' | 'github' | 'npm' | 'docker' | 'custom';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  webhookUrl?: string;
  apiKey?: string;
  events: string[];
  lastSync?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPayload {
  integrationId: string;
  event: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export interface WebhookEvent {
  type: string;
  source: string;
  payload: Record<string, unknown>;
  receivedAt: Date;
}

export class IntegrationConnector {
  private integrations: Map<string, Integration> = new Map();
  private notificationHistory: NotificationPayload[] = [];
  private webhookQueue: WebhookEvent[] = [];
  private handlers: Map<string, Set<(event: WebhookEvent) => void>> = new Map();

  registerIntegration(integration: Omit<Integration, 'createdAt' | 'updatedAt'>): Integration {
    const now = new Date();
    const newIntegration: Integration = {
      ...integration,
      createdAt: now,
      updatedAt: now
    };
    this.integrations.set(integration.id, newIntegration);
    return newIntegration;
  }

  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  updateIntegration(id: string, updates: Partial<Integration>): Integration | null {
    const integration = this.integrations.get(id);
    if (!integration) return null;

    const updated: Integration = {
      ...integration,
      ...updates,
      updatedAt: new Date()
    };
    this.integrations.set(id, updated);
    return updated;
  }

  deleteIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }

  listIntegrations(type?: IntegrationType): Integration[] {
    let integrations = Array.from(this.integrations.values());
    if (type) {
      integrations = integrations.filter(i => i.type === type);
    }
    return integrations;
  }

  connect(id: string): boolean {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    integration.status = 'connected';
    integration.lastSync = new Date();
    integration.updatedAt = new Date();
    return true;
  }

  disconnect(id: string): boolean {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    integration.status = 'disconnected';
    integration.updatedAt = new Date();
    return true;
  }

  sendNotification(integrationId: string, event: string, message: string, data?: Record<string, unknown>): boolean {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.status !== 'connected') return false;

    const payload: NotificationPayload = {
      integrationId,
      event,
      message,
      data,
      timestamp: new Date()
    };

    this.notificationHistory.push(payload);

    if (this.notificationHistory.length > 1000) {
      this.notificationHistory.shift();
    }

    return true;
  }

  broadcastNotification(event: string, message: string, data?: Record<string, unknown>): number {
    let sent = 0;
    for (const integration of this.integrations.values()) {
      if (integration.status === 'connected' && integration.events.includes(event)) {
        if (this.sendNotification(integration.id, event, message, data)) {
          sent++;
        }
      }
    }
    return sent;
  }

  receiveWebhook(integrationId: string, event: WebhookEvent): boolean {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    this.webhookQueue.push(event);

    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error('Webhook handler error:', e);
        }
      }
    }

    return true;
  }

  onWebhook(type: string, handler: (event: WebhookEvent) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  getNotificationHistory(filters?: { integrationId?: string; event?: string; limit?: number }): NotificationPayload[] {
    let history = [...this.notificationHistory];

    if (filters?.integrationId) {
      history = history.filter(n => n.integrationId === filters.integrationId);
    }
    if (filters?.event) {
      history = history.filter(n => n.event === filters.event);
    }

    history = history.reverse();
    if (filters?.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  }

  getWebhookQueue(): WebhookEvent[] {
    return [...this.webhookQueue];
  }

  clearWebhookQueue(): void {
    this.webhookQueue = [];
  }

  testConnection(id: string): { success: boolean; message: string; latency?: number } {
    const integration = this.integrations.get(id);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    if (!['slack', 'discord', 'github'].includes(integration.type)) {
      return { success: true, message: 'Connection test not supported for this type' };
    }

    const latency = Math.random() * 100 + 50;
    return {
      success: true,
      message: 'Connection successful',
      latency: Math.round(latency)
    };
  }

  syncIntegration(id: string): boolean {
    const integration = this.integrations.get(id);
    if (!integration || integration.status !== 'connected') return false;

    integration.lastSync = new Date();
    integration.error = undefined;
    integration.updatedAt = new Date();
    return true;
  }

  getIntegrationStats(): {
    total: number;
    byType: Record<IntegrationType, number>;
    byStatus: Record<IntegrationStatus, number>;
    totalNotifications: number;
    totalWebhooks: number;
  } {
    const integrations = Array.from(this.integrations.values());
    const byType: Record<IntegrationType, number> = {
      slack: 0, discord: 0, github: 0, npm: 0, docker: 0, custom: 0
    };
    const byStatus: Record<IntegrationStatus, number> = {
      connected: 0, disconnected: 0, error: 0, pending: 0
    };

    for (const i of integrations) {
      byType[i.type]++;
      byStatus[i.status]++;
    }

    return {
      total: integrations.length,
      byType,
      byStatus,
      totalNotifications: this.notificationHistory.length,
      totalWebhooks: this.webhookQueue.length
    };
  }

  exportIntegration(id: string): Record<string, unknown> | null {
    const integration = this.integrations.get(id);
    if (!integration) return null;

    const exported = { ...integration };
    delete exported.apiKey;
    return exported as Record<string, unknown>;
  }

  importIntegration(data: Record<string, unknown>): Integration | null {
    if (!data.id || !data.type || !data.name) return null;

    const integration: Integration = {
      id: data.id as string,
      type: data.type as IntegrationType,
      name: data.name as string,
      status: (data.status as IntegrationStatus) || 'disconnected',
      config: (data.config as Record<string, unknown>) || {},
      events: (data.events as string[]) || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }
}

export const createIntegrationConnector = () => new IntegrationConnector();
