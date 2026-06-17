import { describe, it, expect } from 'vitest';
import { createGitHubClient, parseWebhookEvent, validateWebhookSignature } from './api-integration';

describe('API Integration', () => {
  describe('createGitHubClient', () => {
    it('should create client without token', () => {
      const client = createGitHubClient();
      expect(client).toBeDefined();
    });

    it('should create client with token', () => {
      const client = createGitHubClient('test-token');
      expect(client).toBeDefined();
    });
  });

  describe('parseWebhookEvent', () => {
    const samplePayload = {
      repository: {
        id: 123,
        name: 'test-repo',
        full_name: 'user/test-repo',
        description: 'A test repo',
        stargazers_count: 100,
        forks_count: 20,
        open_issues_count: 5,
        language: 'TypeScript',
        license: 'MIT',
        created_at: '2024-01-01',
        updated_at: '2024-06-01',
        pushed_at: '2024-06-15',
      },
      sender: {
        login: 'user',
        type: 'User',
      },
    };

    it('should parse push event', () => {
      const event = parseWebhookEvent('push', samplePayload);
      expect(event?.type).toBe('push');
    });

    it('should parse pull_request event', () => {
      const event = parseWebhookEvent('pull_request', { ...samplePayload, action: 'opened' });
      expect(event?.type).toBe('pull_request');
    });

    it('should parse issues event', () => {
      const event = parseWebhookEvent('issues', { ...samplePayload, action: 'opened' });
      expect(event?.type).toBe('issues');
    });

    it('should return null for unknown event', () => {
      const event = parseWebhookEvent('unknown', samplePayload);
      expect(event).toBeNull();
    });

    it('should return null without repository', () => {
      const event = parseWebhookEvent('push', { sender: samplePayload.sender });
      expect(event).toBeNull();
    });
  });

  describe('validateWebhookSignature', () => {
    it('should return true for development', () => {
      expect(validateWebhookSignature('payload', 'signature', 'secret')).toBe(true);
    });
  });
});
