import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationConnector } from './integration-connector';

describe('IntegrationConnector', () => {
  let connector: IntegrationConnector;

  beforeEach(() => {
    connector = new IntegrationConnector();
  });

  describe('registerIntegration', () => {
    it('should register new integration', () => {
      const integration = connector.registerIntegration({
        id: 'slack-1',
        type: 'slack',
        name: 'Main Slack',
        status: 'disconnected',
        config: { channel: '#general' },
        events: ['deploy', 'issue']
      });

      expect(integration.id).toBe('slack-1');
      expect(integration.type).toBe('slack');
      expect(integration.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getIntegration', () => {
    it('should return existing integration', () => {
      connector.registerIntegration({
        id: 'test',
        type: 'discord',
        name: 'Test Discord',
        status: 'disconnected',
        config: {},
        events: []
      });

      const found = connector.getIntegration('test');
      expect(found?.name).toBe('Test Discord');
    });

    it('should return undefined for non-existent', () => {
      expect(connector.getIntegration('non-existent')).toBeUndefined();
    });
  });

  describe('connect/disconnect', () => {
    it('should connect integration', () => {
      connector.registerIntegration({
        id: 'conn-test',
        type: 'slack',
        name: 'Connect Test',
        status: 'disconnected',
        config: {},
        events: []
      });

      expect(connector.connect('conn-test')).toBe(true);
      expect(connector.getIntegration('conn-test')?.status).toBe('connected');
    });

    it('should disconnect integration', () => {
      connector.registerIntegration({
        id: 'disc-test',
        type: 'slack',
        name: 'Disconnect Test',
        status: 'connected',
        config: {},
        events: []
      });

      expect(connector.disconnect('disc-test')).toBe(true);
      expect(connector.getIntegration('disc-test')?.status).toBe('disconnected');
    });
  });

  describe('sendNotification', () => {
    it('should send notification to connected integration', () => {
      connector.registerIntegration({
        id: 'notif-test',
        type: 'slack',
        name: 'Notification Test',
        status: 'connected',
        config: {},
        events: ['deploy']
      });

      expect(connector.sendNotification('notif-test', 'deploy', 'Deployment started')).toBe(true);
      const history = connector.getNotificationHistory({ integrationId: 'notif-test' });
      expect(history).toHaveLength(1);
      expect(history[0].message).toBe('Deployment started');
    });

    it('should not send to disconnected integration', () => {
      connector.registerIntegration({
        id: 'offline-notif',
        type: 'slack',
        name: 'Offline',
        status: 'disconnected',
        config: {},
        events: []
      });

      expect(connector.sendNotification('offline-notif', 'event', 'Test')).toBe(false);
    });
  });

  describe('broadcastNotification', () => {
    it('should broadcast to all connected integrations with matching event', () => {
      connector.registerIntegration({
        id: 'broadcast-1',
        type: 'slack',
        name: 'Broadcast 1',
        status: 'connected',
        config: {},
        events: ['deploy']
      });
      connector.registerIntegration({
        id: 'broadcast-2',
        type: 'discord',
        name: 'Broadcast 2',
        status: 'connected',
        config: {},
        events: ['deploy']
      });
      connector.registerIntegration({
        id: 'broadcast-3',
        type: 'github',
        name: 'Broadcast 3',
        status: 'connected',
        config: {},
        events: ['issue']
      });

      const sent = connector.broadcastNotification('deploy', 'New deployment!');
      expect(sent).toBe(2);
    });
  });

  describe('receiveWebhook', () => {
    it('should receive and queue webhook', () => {
      connector.registerIntegration({
        id: 'webhook-test',
        type: 'github',
        name: 'Webhook Test',
        status: 'connected',
        config: {},
        events: ['push']
      });

      connector.receiveWebhook('webhook-test', {
        type: 'push',
        source: 'github',
        payload: { ref: 'refs/heads/main' },
        receivedAt: new Date()
      });

      const queue = connector.getWebhookQueue();
      expect(queue).toHaveLength(1);
    });

    it('should call registered handler', () => {
      connector.registerIntegration({
        id: 'handler-test',
        type: 'github',
        name: 'Handler Test',
        status: 'connected',
        config: {},
        events: ['push']
      });

      let called = false;
      connector.onWebhook('push', () => { called = true; });

      connector.receiveWebhook('handler-test', {
        type: 'push',
        source: 'github',
        payload: {},
        receivedAt: new Date()
      });

      expect(called).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should test connection for supported type', () => {
      connector.registerIntegration({
        id: 'test-conn',
        type: 'slack',
        name: 'Test Connection',
        status: 'disconnected',
        config: {},
        events: []
      });

      const result = connector.testConnection('test-conn');
      expect(result.success).toBe(true);
    });

    it('should return error for non-existent', () => {
      const result = connector.testConnection('non-existent');
      expect(result.success).toBe(false);
    });
  });

  describe('getIntegrationStats', () => {
    it('should return correct statistics', () => {
      connector.registerIntegration({
        id: 'stats-1',
        type: 'slack',
        name: 'Stats 1',
        status: 'connected',
        config: {},
        events: []
      });
      connector.registerIntegration({
        id: 'stats-2',
        type: 'discord',
        name: 'Stats 2',
        status: 'disconnected',
        config: {},
        events: []
      });

      const stats = connector.getIntegrationStats();
      expect(stats.total).toBe(2);
      expect(stats.byType.slack).toBe(1);
      expect(stats.byType.discord).toBe(1);
      expect(stats.byStatus.connected).toBe(1);
    });
  });

  describe('export/import', () => {
    it('should export integration without sensitive data', () => {
      connector.registerIntegration({
        id: 'export-test',
        type: 'slack',
        name: 'Export Test',
        status: 'connected',
        config: { channel: '#general' },
        apiKey: 'secret-key',
        events: ['deploy']
      });

      const exported = connector.exportIntegration('export-test');
      expect(exported).not.toBeNull();
      expect(exported?.id).toBe('export-test');
      expect((exported as any).apiKey).toBeUndefined();
    });

    it('should import integration', () => {
      const imported = connector.importIntegration({
        id: 'imported',
        type: 'discord',
        name: 'Imported',
        status: 'connected',
        config: {},
        events: ['alert']
      });

      expect(imported).not.toBeNull();
      expect(connector.getIntegration('imported')?.name).toBe('Imported');
    });
  });
});
