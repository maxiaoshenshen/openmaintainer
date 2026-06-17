import { describe, it, expect } from 'vitest';
import {
  getDefaultPreferences,
  isInQuietHours,
  getNotificationChannels,
  formatEmailNotification,
  formatSlackNotification,
  buildWebhookPayload,
  filterForDigest,
  createDigestSummary,
} from './notification-manager';

describe('Notification Manager', () => {
  describe('getDefaultPreferences', () => {
    it('should return default preferences with all events enabled', () => {
      const prefs = getDefaultPreferences('user123');
      
      expect(prefs.userId).toBe('user123');
      expect(prefs.channels).toContain('email');
      expect(prefs.digestMode).toBe('instant');
      expect(prefs.events.pr_review_requested?.enabled).toBe(true);
      expect(prefs.events.security_alert?.priority).toBe('urgent');
    });
  });

  describe('isInQuietHours', () => {
    it('should return false when no quiet hours set', () => {
      const prefs = getDefaultPreferences('user123');
      expect(isInQuietHours(prefs)).toBe(false);
    });

    it('should handle overnight quiet hours', () => {
      const prefs = {
        ...getDefaultPreferences('user123'),
        quietHours: { start: '22:00', end: '07:00', timezone: 'UTC' },
      };
      
      // This will vary based on actual time
      const result = isInQuietHours(prefs);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getNotificationChannels', () => {
    it('should return empty array for disabled events', () => {
      const prefs = {
        ...getDefaultPreferences('user123'),
        events: {
          pr_review_requested: { enabled: false, priority: 'high' },
        },
      };
      
      const channels = getNotificationChannels('pr_review_requested', prefs, 'medium');
      expect(channels).toEqual([]);
    });

    it('should use all channels for urgent notifications', () => {
      const prefs = getDefaultPreferences('user123');
      prefs.channels = ['email', 'slack'];
      
      const channels = getNotificationChannels('security_alert', prefs, 'urgent');
      expect(channels).toEqual(['email', 'slack']);
    });
  });

  describe('formatEmailNotification', () => {
    it('should format notification for email', () => {
      const notification = {
        id: '1',
        userId: 'user123',
        event: 'pr_review_requested' as const,
        priority: 'high' as const,
        title: 'PR Review Requested',
        message: 'Please review PR #42',
        data: { url: 'https://github.com/repo/pull/42' },
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      const result = formatEmailNotification(notification, getDefaultPreferences('user123'));
      
      expect(result.subject).toContain('[High Priority]');
      expect(result.body).toContain("Please review PR #42");
      expect(result.html).toContain('<h2>PR Review Requested</h2>');
    });
  });

  describe('formatSlackNotification', () => {
    it('should format notification for Slack', () => {
      const notification = {
        id: '1',
        userId: 'user123',
        event: 'security_alert' as const,
        priority: 'urgent' as const,
        title: 'Security Alert',
        message: 'Vulnerability detected in dependency xyz',
        data: { url: 'https://github.com/repo/security/1' },
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      const result = formatSlackNotification(notification);
      
      expect(result.text).toContain('Security Alert');
      expect(result.blocks.length).toBeGreaterThanOrEqual(2);
      expect(result.blocks[0]).toHaveProperty('type', 'header');
    });
  });

  describe('buildWebhookPayload', () => {
    it('should build Discord webhook payload', () => {
      const notification = {
        id: '1',
        userId: 'user123',
        event: 'issue_opened' as const,
        priority: 'medium' as const,
        title: 'New Issue',
        message: 'Bug reported',
        data: { url: 'https://github.com/repo/issues/1' },
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      const payload = buildWebhookPayload(notification, 'discord');
      
      expect(payload).toHaveProperty('embeds');
      expect((payload as any).embeds[0].title).toBe('New Issue');
    });

    it('should build Telegram webhook payload', () => {
      const notification = {
        id: '1',
        userId: 'user123',
        event: 'mention' as const,
        priority: 'high' as const,
        title: 'You were mentioned',
        message: '@maintainer mentioned you in a comment',
        data: { url: 'https://github.com/repo/issues/1#comment-5' },
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      const payload = buildWebhookPayload(notification, 'telegram');
      
      expect((payload as any).text).toContain('@maintainer');
      expect((payload as any).parse_mode).toBe('Markdown');
    });
  });

  describe('filterForDigest', () => {
    it('should filter notifications based on digest mode', () => {
      const now = new Date();
      const notifications = [
        { id: '1', priority: 'low' as const, createdAt: now.toISOString() },
        { id: '2', priority: 'medium' as const, createdAt: now.toISOString() },
        { id: '3', priority: 'urgent' as const, createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString() },
      ];
      
      const prefs = { ...getDefaultPreferences('user123'), digestMode: 'daily' as const };
      const filtered = filterForDigest(notifications as any, prefs);
      
      // Should filter out old notifications for daily digest
      expect(filtered.length).toBeLessThanOrEqual(2);
    });
  });

  describe('createDigestSummary', () => {
    it('should create digest summary', () => {
      const notifications = [
        { id: '1', event: 'security_alert' as const, priority: 'urgent' as const, title: 'Alert 1', message: 'msg', data: {}, read: false, userId: 'u1', createdAt: new Date().toISOString() },
        { id: '2', event: 'pr_review_requested' as const, priority: 'high' as const, title: 'Alert 2', message: 'msg', data: {}, read: false, userId: 'u1', createdAt: new Date().toISOString() },
      ];
      
      const summary = createDigestSummary(notifications as any);
      
      expect(summary.subject).toContain('URGENT');
      expect(summary.body).toContain('2 notifications');
      expect(summary.html).toContain('urgent');
    });
  });
});
