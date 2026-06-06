import { describe, it, expect } from 'vitest';
import {
  calculateNotificationSummary,
  filterNotifications,
  sortNotifications,
  generateNotificationDigest,
  formatNotification,
  getNotificationPriority,
  NotificationType,
  NotificationPriority,
  Notification,
} from './notification-system';

describe('Notification System', () => {
  const mockNotification = (overrides?: Partial<Notification>): Notification => ({
    id: 'test-id',
    type: 'pr_review' as NotificationType,
    priority: 'normal' as NotificationPriority,
    title: 'Test Notification',
    body: 'Test body',
    actor: 'test-user',
    repository: 'test-repo',
    timestamp: new Date(),
    read: false,
    ...overrides,
  });

  describe('calculateNotificationSummary', () => {
    it('calculates correct summary', () => {
      const notifications = [
        mockNotification({ read: false }),
        mockNotification({ read: true }),
        mockNotification({ read: false }),
      ];
      const summary = calculateNotificationSummary(notifications);
      expect(summary.unread).toBe(2);
      expect(summary.byType.pr_review).toBe(3);
    });
  });

  describe('filterNotifications', () => {
    it('filters by type', () => {
      const notifications = [
        mockNotification({ type: 'pr_review' }),
        mockNotification({ type: 'issue_comment' }),
      ];
      const filtered = filterNotifications(notifications, { type: 'pr_review' });
      expect(filtered.length).toBe(1);
    });

    it('filters unread only', () => {
      const notifications = [
        mockNotification({ read: false }),
        mockNotification({ read: true }),
      ];
      const filtered = filterNotifications(notifications, { unreadOnly: true });
      expect(filtered.length).toBe(1);
    });
  });

  describe('sortNotifications', () => {
    it('sorts unread first', () => {
      const notifications = [
        mockNotification({ read: true }),
        mockNotification({ read: false }),
      ];
      const sorted = sortNotifications(notifications);
      expect(sorted[0].read).toBe(false);
    });
  });

  describe('getNotificationPriority', () => {
    it('returns urgent for security content', () => {
      const priority = getNotificationPriority({
        type: 'mention',
        title: 'Critical Security Issue',
        body: 'Urgent attention needed',
      });
      expect(priority).toBe('urgent');
    });

    it('returns high for mention type', () => {
      const priority = getNotificationPriority({
        type: 'mention',
        title: 'Hello',
        body: 'Test',
      });
      expect(priority).toBe('high');
    });
  });

  describe('formatNotification', () => {
    it('formats notification correctly', () => {
      const notification = mockNotification({ title: 'PR Review' });
      const formatted = formatNotification(notification);
      expect(formatted).toContain('PR Review');
    });
  });

  describe('generateNotificationDigest', () => {
    it('generates digest with count', () => {
      const notifications = [
        mockNotification({ read: false }),
        mockNotification({ read: true }),
      ];
      const digest = generateNotificationDigest(notifications, { enabled: true, frequency: 'daily' });
      expect(digest).toContain('unread');
      expect(digest).toContain('2');
    });
  });
});
