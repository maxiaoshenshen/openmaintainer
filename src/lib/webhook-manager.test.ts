import { describe, it, expect } from 'vitest';
import {
  createWebhookEvent,
  validateWebhookSignature,
  parseEventType,
  filterEvents,
  getDeliveryStats,
  getRetryableEvents
} from './webhook-manager';

describe('webhook-manager', () => {
  describe('createWebhookEvent', () => {
    it('should create event from payload', () => {
      const event = createWebhookEvent({
        action: 'opened',
        repository: { full_name: 'owner/repo' },
        sender: { login: 'user' }
      });
      expect(event.repository).toBe('owner/repo');
      expect(event.sender).toBe('user');
      expect(event.action).toBe('opened');
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate correct signature', () => {
      const payload = '{"test": "data"}';
      const crypto = require('crypto');
      const secret = 'test-secret';
      const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
      expect(validateWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      expect(validateWebhookSignature('data', 'invalid', 'secret')).toBe(false);
    });
  });

  describe('parseEventType', () => {
    it('should parse event type', () => {
      expect(parseEventType('issues.opened')).toEqual({ event: 'issues', action: 'opened' });
      expect(parseEventType('push')).toEqual({ event: 'push' });
    });
  });

  describe('filterEvents', () => {
    it('should filter by repository', () => {
      const events = [
        createWebhookEvent({ repository: { full_name: 'a/b' }, sender: { login: 'u1' } }),
        createWebhookEvent({ repository: { full_name: 'c/d' }, sender: { login: 'u2' } })
      ];
      const filtered = filterEvents(events, { repository: 'a/b' });
      expect(filtered).toHaveLength(1);
    });
  });

  describe('getDeliveryStats', () => {
    it('should calculate stats', () => {
      const deliveries = [
        { id: '1', webhookId: 'w1', event: 'push', success: true, statusCode: 200, deliveredAt: new Date(), duration: 100 },
        { id: '2', webhookId: 'w1', event: 'push', success: false, statusCode: 500, deliveredAt: new Date(), duration: 50 }
      ] as any[];
      const stats = getDeliveryStats(deliveries);
      expect(stats.total).toBe(2);
      expect(stats.successRate).toBe(50);
    });
  });

  describe('getRetryableEvents', () => {
    it('should find retryable events', () => {
      const deliveries = [
        { id: '1', success: false },
        { id: '1', success: false },
        { id: '2', success: false }
      ] as any[];
      expect(getRetryableEvents(deliveries, 3)).toContain('1');
    });
  });
});
