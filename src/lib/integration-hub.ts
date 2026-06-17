import { GitHubClient } from './github-client';

/**
 * Third-party integration hub
 * Connects GitHub with Slack, Discord, Twitter, etc.
 */
export type IntegrationType = 'slack' | 'discord' | 'twitter' | 'email' | 'webhook' | 'custom';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
  events: string[];
}

export interface NotificationPayload {
  integrationId: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
}

export interface SlackChannel {
  id: string;
  name: string;
  webhookUrl?: string;
}

export interface DiscordWebhook {
  id: string;
  name: string;
  webhookUrl: string;
}

export class IntegrationHub {
  private github: GitHubClient;
  private integrations: Map<string, Integration>;
  private webhookQueue: NotificationPayload[];

  constructor(github: GitHubClient) {
    this.github = github;
    this.integrations = new Map();
    this.webhookQueue = [];
  }

  /**
   * Add a new integration
   */
  addIntegration(integration: Integration): void {
    this.integrations.set(integration.id, integration);
  }

  /**
   * Get all integrations
   */
  getIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integration by ID
   */
  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  /**
   * Enable/disable integration
   */
  toggleIntegration(id: string, enabled: boolean): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      integration.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Remove integration
   */
  removeIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }

  /**
   * Configure Slack integration
   */
  configureSlack(channelId: string, webhookUrl: string, events: string[]): Integration {
    const integration: Integration = {
      id: `slack-${channelId}`,
      type: 'slack',
      name: `Slack #${channelId}`,
      enabled: true,
      config: { webhookUrl, channelId },
      events
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }

  /**
   * Configure Discord integration
   */
  configureDiscord(webhookId: string, webhookUrl: string, events: string[]): Integration {
    const integration: Integration = {
      id: `discord-${webhookId}`,
      type: 'discord',
      name: `Discord webhook ${webhookId}`,
      enabled: true,
      config: { webhookUrl, webhookId },
      events
    };
    this.integrations.set(integration.id, integration);
    return integration;
  }

  /**
   * Add webhook integration
   */
  addWebhook(config: WebhookConfig): Integration {
    const id = `webhook-${Date.now()}`;
    const integration: Integration = {
      id,
      type: 'webhook',
      name: `Webhook ${id}`,
      enabled: true,
      config: { url: config.url, secret: config.secret || '' },
      events: config.events
    };

    this.integrations.set(id, integration);
    return integration;
  }

  /**
   * Send notification to integration
   */
  async notify(event: string, data: Record<string, any>): Promise<void> {
    const payload: NotificationPayload = {
      integrationId: 'all',
      event,
      data,
      timestamp: new Date().toISOString()
    };

    for (const integration of this.integrations.values()) {
      if (integration.enabled && integration.events.includes(event)) {
        await this.sendToIntegration(integration, payload);
      }
    }
  }

  private async sendToIntegration(integration: Integration, payload: NotificationPayload): Promise<void> {
    if (integration.type === 'webhook' || integration.type === 'slack' || integration.type === 'discord') {
      const url = integration.config.webhookUrl || integration.config.url;
      if (url) {
        this.webhookQueue.push({ ...payload, integrationId: integration.id });
      }
    }
  }

  /**
   * Format notification for Slack
   */
  formatSlackMessage(event: string, data: Record<string, any>): any {
    const emoji = this.getEventEmoji(event);
    const text = this.getEventDescription(event, data);

    return {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${emoji} ${event}`, emoji: true }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text }
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `Sent at ${new Date().toLocaleString()}` }
          ]
        }
      ]
    };
  }

  /**
   * Format notification for Discord
   */
  formatDiscordMessage(event: string, data: Record<string, any>): any {
    const color = this.getEventColor(event);
    const description = this.getEventDescription(event, data);

    return {
      embeds: [{
        title: event,
        description,
        color,
        timestamp: new Date().toISOString(),
        fields: Object.entries(data).slice(0, 5).map(([key, value]) => ({
          name: key,
          value: String(value).substring(0, 1024),
          inline: true
        }))
      }]
    };
  }

  private getEventEmoji(event: string): string {
    const emojis: Record<string, string> = {
      'issue.opened': '🐛',
      'issue.closed': '✅',
      'pull_request.opened': '🚀',
      'pull_request.merged': '🎉',
      'release.published': '📦',
      'star.added': '⭐',
      'fork.created': '🍴',
      'comment.created': '💬',
      'security.vulnerability': '🔒',
      'build.failed': '❌',
      'build.succeeded': '✓'
    };
    return emojis[event] || '📢';
  }

  private getEventColor(event: string): number {
    if (event.includes('failed') || event.includes('vulnerability')) return 15158332;
    if (event.includes('merged') || event.includes('succeeded')) return 3066993;
    return 3447003;
  }

  private getEventDescription(event: string, data: Record<string, any>): string {
    const templates: Record<string, string> = {
      'issue.opened': `New issue: *${data.title || 'Untitled'}*`,
      'issue.closed': `Issue closed: *${data.title || 'Untitled'}*`,
      'pull_request.opened': `New PR: *${data.title || 'Untitled'}* by @${data.author || 'unknown'}`,
      'pull_request.merged': `PR merged: *${data.title || 'Untitled'}*`,
      'release.published': `New release: *${data.tag || 'v1.0.0'}*`,
      'star.added': `@${data.actor || 'Someone'} starred the repo`,
      'fork.created': `@${data.actor || 'Someone'} forked the repo`,
      'comment.created': `New comment on ${data.context || 'issue/PR'}`,
      'security.vulnerability': `Security vulnerability detected: ${data.title || 'Unknown'}`,
      'build.failed': `Build failed: ${data.branch || 'main'}`,
      'build.succeeded': `Build succeeded: ${data.branch || 'main'}`
    };

    return templates[event] || JSON.stringify(data).substring(0, 200);
  }

  /**
   * Get pending webhook queue
   */
  getPendingWebhooks(): NotificationPayload[] {
    return [...this.webhookQueue];
  }

  /**
   * Clear webhook queue
   */
  clearQueue(): void {
    this.webhookQueue = [];
  }

  /**
   * Process webhook queue
   */
  async processQueue(): Promise<number> {
    const count = this.webhookQueue.length;
    this.webhookQueue = [];
    return count;
  }

  /**
   * Export integration config
   */
  exportConfig(): string {
    return JSON.stringify({
      integrations: this.getIntegrations(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import integration config
   */
  importConfig(json: string): void {
    const data = JSON.parse(json);
    if (data.integrations) {
      for (const integration of data.integrations) {
        this.integrations.set(integration.id, integration);
      }
    }
  }

  /**
   * Test integration
   */
  async testIntegration(id: string): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    const testPayload: NotificationPayload = {
      integrationId: id,
      event: 'test',
      data: { message: 'This is a test notification' },
      timestamp: new Date().toISOString()
    };

    await this.sendToIntegration(integration, testPayload);
    return true;
  }

  /**
   * Get supported events
   */
  getSupportedEvents(): string[] {
    return [
      'issue.opened',
      'issue.closed',
      'pull_request.opened',
      'pull_request.merged',
      'pull_request.closed',
      'release.published',
      'star.added',
      'fork.created',
      'comment.created',
      'security.vulnerability',
      'build.failed',
      'build.succeeded',
      'deployment.completed',
      'member.added'
    ];
  }

  /**
   * Filter integrations by type
   */
  getIntegrationsByType(type: IntegrationType): Integration[] {
    return this.getIntegrations().filter(i => i.type === type);
  }

  /**
   * Get integration statistics
   */
  getStats(): { total: number; enabled: number; byType: Record<string, number> } {
    const all = this.getIntegrations();
    const byType: Record<string, number> = {};

    for (const integration of all) {
      byType[integration.type] = (byType[integration.type] || 0) + 1;
    }

    return {
      total: all.length,
      enabled: all.filter(i => i.enabled).length,
      byType
    };
  }
}
