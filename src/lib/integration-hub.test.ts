import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationHub } from './integration-hub';
import { GitHubClient } from './github-client';

describe('IntegrationHub', () => {
  let hub: IntegrationHub;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {} as GitHubClient;
    hub = new IntegrationHub(mockGithub);
  });

  describe('addIntegration', () => {
    it('should add integration', () => {
      hub.addIntegration({
        id: 'test-1',
        type: 'slack',
        name: 'Test Slack',
        enabled: true,
        config: {},
        events: ['issue.opened']
      });

      expect(hub.getIntegrations()).toHaveLength(1);
    });
  });

  describe('getIntegration', () => {
    it('should return integration by id', () => {
      hub.addIntegration({
        id: 'test-1',
        type: 'slack',
        name: 'Test Slack',
        enabled: true,
        config: {},
        events: ['issue.opened']
      });

      const integration = hub.getIntegration('test-1');
      expect(integration).toBeTruthy();
      expect(integration?.name).toBe('Test Slack');
    });

    it('should return undefined for non-existent id', () => {
      const integration = hub.getIntegration('non-existent');
      expect(integration).toBeUndefined();
    });
  });

  describe('toggleIntegration', () => {
    it('should toggle integration state', () => {
      hub.addIntegration({
        id: 'test-1',
        type: 'slack',
        name: 'Test Slack',
        enabled: true,
        config: {},
        events: []
      });

      expect(hub.toggleIntegration('test-1', false)).toBe(true);
      expect(hub.getIntegration('test-1')?.enabled).toBe(false);
    });
  });

  describe('removeIntegration', () => {
    it('should remove integration', () => {
      hub.addIntegration({
        id: 'test-1',
        type: 'slack',
        name: 'Test Slack',
        enabled: true,
        config: {},
        events: []
      });

      expect(hub.removeIntegration('test-1')).toBe(true);
      expect(hub.getIntegration('test-1')).toBeUndefined();
    });
  });

  describe('configureSlack', () => {
    it('should configure Slack integration', () => {
      const integration = hub.configureSlack('C123', 'https://hooks.slack.com/test', ['issue.opened']);

      expect(integration.type).toBe('slack');
      expect(integration.config.channelId).toBe('C123');
      expect(integration.enabled).toBe(true);
    });
  });

  describe('configureDiscord', () => {
    it('should configure Discord integration', () => {
      const integration = hub.configureDiscord('123', 'https://discord.com/webhook/test', ['pull_request.merged']);

      expect(integration.type).toBe('discord');
      expect(integration.config.webhookId).toBe('123');
    });
  });

  describe('addWebhook', () => {
    it('should add webhook integration', () => {
      const integration = hub.addWebhook({
        url: 'https://example.com/webhook',
        events: ['issue.opened']
      });

      expect(integration.type).toBe('webhook');
      expect(integration.config.url).toBe('https://example.com/webhook');
    });
  });

  describe('formatSlackMessage', () => {
    it('should format Slack message', () => {
      const message = hub.formatSlackMessage('issue.opened', { title: 'Test issue' });

      expect(message).toHaveProperty('blocks');
      expect(message.blocks).toHaveLength(3);
      expect(message.blocks[0]).toHaveProperty('text');
    });
  });

  describe('formatDiscordMessage', () => {
    it('should format Discord message', () => {
      const message = hub.formatDiscordMessage('issue.opened', { title: 'Test issue' });

      expect(message).toHaveProperty('embeds');
      expect(message.embeds[0].title).toBe('issue.opened');
    });
  });

  describe('getSupportedEvents', () => {
    it('should return list of supported events', () => {
      const events = hub.getSupportedEvents();

      expect(events).toContain('issue.opened');
      expect(events).toContain('pull_request.merged');
      expect(events).toContain('release.published');
    });
  });

  describe('getStats', () => {
    it('should return integration statistics', () => {
      hub.configureSlack('C1', 'https://test.slack.com', ['issue.opened']);
      hub.configureDiscord('D1', 'https://test.discord.com', ['issue.closed']);

      const stats = hub.getStats();

      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(2);
      expect(stats.byType.slack).toBe(1);
      expect(stats.byType.discord).toBe(1);
    });
  });

  describe('exportConfig / importConfig', () => {
    it('should export and import config', () => {
      hub.configureSlack('C1', 'https://test.slack.com', ['issue.opened']);

      const exported = hub.exportConfig();
      expect(exported).toContain('integrations');

      const newHub = new IntegrationHub(mockGithub);
      newHub.importConfig(exported);
      expect(newHub.getIntegrations()).toHaveLength(1);
    });
  });

  describe('getIntegrationsByType', () => {
    it('should filter by type', () => {
      hub.configureSlack('C1', 'https://test.slack.com', []);
      hub.configureDiscord('D1', 'https://test.discord.com', []);

      const slackIntegrations = hub.getIntegrationsByType('slack');
      expect(slackIntegrations).toHaveLength(1);
      expect(slackIntegrations[0].type).toBe('slack');
    });
  });
});
