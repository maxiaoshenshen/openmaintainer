import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  createWebhookServer,
  processWorkflowEvent,
  formatWebhookNotification,
} from './webhook-handler';

describe('Webhook Handler', () => {
  describe('verifyWebhookSignature', () => {
    it('should return true when no secret is configured', () => {
      const result = verifyWebhookSignature('payload', 'signature', '');
      expect(result).toBe(true);
    });

    it('should verify correct signature', () => {
      const crypto = require('crypto');
      const secret = 'test-secret';
      const payload = '{"test": "data"}';
      const hmac = crypto.createHmac('sha256', secret);
      const signature = 'sha256=' + hmac.update(payload).digest('hex');
      
      const result = verifyWebhookSignature(payload, signature, secret);
      expect(result).toBe(true);
    });
  });

  describe('parseWebhookPayload', () => {
    it('should parse webhook payload correctly', () => {
      const payload = {
        action: 'opened',
        sender: { login: 'testuser', id: 123, type: 'User' },
        repository: {
          id: 1,
          name: 'test-repo',
          full_name: 'org/test-repo',
          owner: { login: 'org' },
        },
      };

      const result = parseWebhookPayload('issues', payload);

      expect(result.event).toBe('issues');
      expect(result.action).toBe('opened');
      expect(result.sender).toBe('testuser');
      expect(result.repository).toBe('org/test-repo');
      expect(result.id).toBeDefined();
    });
  });

  describe('createWebhookServer', () => {
    it('should process events with registered handlers', async () => {
      let handlerCalled = false;
      const server = createWebhookServer({
        handlers: [
          {
            event: 'push',
            handler: async () => { handlerCalled = true; },
          },
        ],
      });

      await server.process('push', {
        sender: { login: 'user', id: 1, type: 'User' },
        repository: {
          id: 1,
          name: 'repo',
          full_name: 'user/repo',
          owner: { login: 'user' },
        },
      });

      expect(handlerCalled).toBe(true);
    });

    it('should return processed events', async () => {
      const server = createWebhookServer({ handlers: [] });

      await server.process('issues', {
        action: 'opened',
        sender: { login: 'user', id: 1, type: 'User' },
        repository: {
          id: 1,
          name: 'repo',
          full_name: 'user/repo',
          owner: { login: 'user' },
        },
      });

      const events = server.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('issues');
    });

    it('should filter events by type', async () => {
      const server = createWebhookServer({ handlers: [] });

      await server.process('push', {
        sender: { login: 'user', id: 1, type: 'User' },
        repository: { id: 1, name: 'repo', full_name: 'user/repo', owner: { login: 'user' } },
      });
      await server.process('issues', {
        sender: { login: 'user', id: 1, type: 'User' },
        repository: { id: 1, name: 'repo', full_name: 'user/repo', owner: { login: 'user' } },
      });

      const pushEvents = server.getEventsByType('push');
      expect(pushEvents.length).toBe(1);
    });

    it('should clear event history', async () => {
      const server = createWebhookServer({ handlers: [] });

      await server.process('push', {
        sender: { login: 'user', id: 1, type: 'User' },
        repository: { id: 1, name: 'repo', full_name: 'user/repo', owner: { login: 'user' } },
      });

      server.clearHistory();
      expect(server.getEvents().length).toBe(0);
    });
  });

  describe('processWorkflowEvent', () => {
    it('should process workflow_run event', () => {
      const payload = {
        action: 'completed',
        workflow: 'CI',
        workflow_run: {
          id: 123,
          status: 'completed',
          conclusion: 'success',
          name: 'CI',
        },
        sender: { login: 'user', id: 1, type: 'User' },
        repository: {
          id: 1,
          name: 'repo',
          full_name: 'user/repo',
          owner: { login: 'user' },
        },
      };

      const result = processWorkflowEvent(payload);

      expect(result).not.toBeNull();
      expect(result!.workflow).toBe('CI');
      expect(result!.run_id).toBe(123);
      expect(result!.status).toBe('completed');
      expect(result!.conclusion).toBe('success');
    });

    it('should return null for non-workflow events', () => {
      const payload = {
        sender: { login: 'user', id: 1, type: 'User' },
        repository: {
          id: 1,
          name: 'repo',
          full_name: 'user/repo',
          owner: { login: 'user' },
        },
      };

      const result = processWorkflowEvent(payload);
      expect(result).toBeNull();
    });
  });

  describe('formatWebhookNotification', () => {
    it('should format push event notification', () => {
      const event = {
        id: '1',
        event: 'push' as const,
        sender: 'user',
        repository: 'org/repo',
        timestamp: new Date(),
        data: {},
      };

      const result = formatWebhookNotification(event);
      expect(result).toContain('New push');
    });

    it('should format PR event notification', () => {
      const event = {
        id: '1',
        event: 'pull_request' as const,
        action: 'opened',
        sender: 'user',
        repository: 'org/repo',
        timestamp: new Date(),
        data: {},
      };

      const result = formatWebhookNotification(event);
      expect(result).toContain('PR opened');
    });

    it('should format release event notification', () => {
      const event = {
        id: '1',
        event: 'release' as const,
        action: 'published',
        sender: 'user',
        repository: 'org/repo',
        timestamp: new Date(),
        data: {},
      };

      const result = formatWebhookNotification(event);
      expect(result).toContain('Release published');
    });
  });
});
