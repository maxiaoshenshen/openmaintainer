import { describe, it, expect } from 'vitest';
import { 
  generateTestPayload,
  validatePayload,
  createWebhookConfig,
  generateWebhookSignature,
  verifyWebhookSignature,
  recordDelivery,
  analyzeWebhookPerformance
} from './webhook-manager';

describe('webhook-manager', () => {
  describe('generateTestPayload', () => {
    it('should generate push payload', () => {
      const payload = generateTestPayload('push');
      
      expect(payload).toHaveProperty('ref');
      expect(payload).toHaveProperty('commits');
      expect(payload).toHaveProperty('repository');
      expect(payload).toHaveProperty('sender');
    });

    it('should generate pull_request payload', () => {
      const payload = generateTestPayload('pull_request');
      
      expect(payload).toHaveProperty('pull_request');
      expect((payload as any).pull_request).toHaveProperty('title');
    });

    it('should generate issues payload', () => {
      const payload = generateTestPayload('issues');
      
      expect(payload).toHaveProperty('issue');
      expect((payload as any).issue).toHaveProperty('title');
    });

    it('should generate release payload', () => {
      const payload = generateTestPayload('release');
      
      expect(payload).toHaveProperty('release');
      expect((payload as any).release).toHaveProperty('tag_name');
    });
  });

  describe('validatePayload', () => {
    it('should validate correct payload', () => {
      const payload = generateTestPayload('push');
      const result = validatePayload('push', payload);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty payload', () => {
      const result = validatePayload('push', null);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject payload without repository', () => {
      const result = validatePayload('push', { sender: {} });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: repository');
    });

    it('should reject push without ref', () => {
      const result = validatePayload('push', { repository: {}, sender: {} });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Push event requires ref field');
    });
  });

  describe('createWebhookConfig', () => {
    it('should create webhook config', () => {
      const config = createWebhookConfig({
        url: 'https://example.com/webhook',
        events: ['push', 'pull_request'],
      });
      
      expect(config.url).toBe('https://example.com/webhook');
      expect(config.events).toEqual(['push', 'pull_request']);
      expect(config.active).toBe(true);
    });

    it('should include secret if provided', () => {
      const config = createWebhookConfig({
        url: 'https://example.com/webhook',
        events: ['push'],
        secret: 'mysecret',
      });
      
      expect(config.secret).toBe('mysecret');
    });
  });

  describe('generateWebhookSignature', () => {
    it('should generate sha256 signature', () => {
      const signature = generateWebhookSignature('test payload', 'secret');
      
      expect(signature).toMatch(/^sha256=[a-f0-9]+$/);
    });

    it('should generate sha1 signature', () => {
      const signature = generateWebhookSignature('test payload', 'secret', 'sha1');
      
      expect(signature).toMatch(/^sha1=[a-f0-9]+$/);
    });

    it('should generate consistent signatures', () => {
      const sig1 = generateWebhookSignature('payload', 'secret');
      const sig2 = generateWebhookSignature('payload', 'secret');
      
      expect(sig1).toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = 'test payload';
      const secret = 'secret';
      const signature = generateWebhookSignature(payload, secret);
      
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = 'test payload';
      const secret = 'secret';
      
      expect(verifyWebhookSignature(payload, 'sha256=invalid', secret)).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = 'test payload';
      const signature = generateWebhookSignature(payload, 'secret1');
      
      expect(verifyWebhookSignature(payload, signature, 'secret2')).toBe(false);
    });
  });

  describe('recordDelivery', () => {
    it('should record successful delivery', () => {
      const log = { deliveries: [], totalRequests: 0, successRate: 0, averageResponseTime: 0 };
      
      const updated = recordDelivery(log, {
        event: 'push',
        status: 'success',
        responseCode: 200,
        duration: 150,
      });
      
      expect(updated.deliveries).toHaveLength(1);
      expect(updated.totalRequests).toBe(1);
      expect(updated.successRate).toBe(100);
    });

    it('should record failed delivery', () => {
      const log = { deliveries: [], totalRequests: 0, successRate: 0, averageResponseTime: 0 };
      
      const updated = recordDelivery(log, {
        event: 'push',
        status: 'failed',
        responseCode: 500,
        error: 'Internal Server Error',
      });
      
      expect(updated.successRate).toBe(0);
    });

    it('should limit delivery history', () => {
      let log = { deliveries: [], totalRequests: 0, successRate: 0, averageResponseTime: 0 };
      
      for (let i = 0; i < 150; i++) {
        log = recordDelivery(log, { event: 'push', status: 'success' });
      }
      
      expect(log.deliveries).toHaveLength(100);
    });
  });

  describe('analyzeWebhookPerformance', () => {
    it('should report healthy when all good', () => {
      const log = {
        deliveries: [
          { id: '1', event: 'push' as const, timestamp: '', status: 'success' as const, duration: 100 },
          { id: '2', event: 'push' as const, timestamp: '', status: 'success' as const, duration: 100 },
        ],
        totalRequests: 2,
        successRate: 100,
        averageResponseTime: 100,
      };
      
      const analysis = analyzeWebhookPerformance(log);
      
      expect(analysis.health).toBe('healthy');
    });

    it('should report degraded with low success rate', () => {
      const log = {
        deliveries: [
          { id: '1', event: 'push' as const, timestamp: '', status: 'failed' as const },
          { id: '2', event: 'push' as const, timestamp: '', status: 'failed' as const },
        ],
        totalRequests: 2,
        successRate: 0,
        averageResponseTime: 100,
      };
      
      const analysis = analyzeWebhookPerformance(log);
      
      expect(analysis.issues.length).toBeGreaterThan(0);
    });
  });
});
