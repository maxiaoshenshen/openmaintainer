import { describe, it, expect } from 'vitest';
import { createNotification, filterNotifications, groupByDate, markAsRead, getUnreadCount } from './notification-system';

describe('Notification System', () => {
  const defaultPreferences = {
    userId: 'user1',
    channels: {
      email: { enabled: true, events: ['new-issue', 'new-pr'] },
      slack: { enabled: true, events: ['new-issue', 'new-pr'] },
      in_app: { enabled: true, events: ['new-issue', 'new-pr', 'pr-merged'] },
    },
    filters: {
      ignoreOwnActions: true,
      minPriority: 'low' as const,
    },
  };

  describe('createNotification', () => {
    it('should create notification for matching event', () => {
      const notification = createNotification('new-issue', {
        repo: 'test-repo',
        title: 'Bug fix',
        number: '123',
        author: 'user1',
        body: 'Fixed the issue',
      }, defaultPreferences);
      
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('new-issue');
    });

    it('should return null for disabled channel', () => {
      const prefs = {
        ...defaultPreferences,
        channels: {
          email: { enabled: false, events: ['new-issue'] },
        },
      };
      const notification = createNotification('new-issue', { repo: 'test', title: 'Test', number: '1', author: 'u' }, prefs);
      expect(notification).toBeNull();
    });

    it('should return null for non-matching event', () => {
      const notification = createNotification('mention', { repo: 'test', mentionedBy: 'user2', context: 'issue #1' }, defaultPreferences);
      expect(notification).toBeNull();
    });
  });

  describe('filterNotifications', () => {
    const notifications = [
      { id: '1', type: 'new-issue', title: 'Issue 1', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-01', read: false },
      { id: '2', type: 'security-alert', title: 'Alert', message: '', priority: 'urgent' as const, channels: ['slack'] as const[], recipient: 'u', createdAt: '2024-01-01', read: false },
      { id: '3', type: 'new-pr', title: 'PR', message: '', priority: 'low' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-01', read: true },
    ];

    it('should filter by unread only', () => {
      const filtered = filterNotifications(notifications, { unreadOnly: true });
      expect(filtered.length).toBe(2);
    });

    it('should filter by priority', () => {
      const filtered = filterNotifications(notifications, { priority: 'high' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter by channel', () => {
      const filtered = filterNotifications(notifications, { channels: ['email'] });
      expect(filtered.length).toBe(2);
    });
  });

  describe('groupByDate', () => {
    it('should group notifications by date', () => {
      const notifications = [
        { id: '1', type: 'new-issue', title: 'Issue 1', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-15T10:00:00Z', read: false },
        { id: '2', type: 'new-pr', title: 'PR', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-15T12:00:00Z', read: false },
        { id: '3', type: 'security-alert', title: 'Alert', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-16T09:00:00Z', read: false },
      ];
      const grouped = groupByDate(notifications);
      expect(Object.keys(grouped).length).toBe(2);
      expect(grouped['1/15/2024'].length).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark specified notifications as read', () => {
      const notifications = [
        { id: '1', type: 'new-issue', title: 'Issue 1', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-01', read: false },
        { id: '2', type: 'new-pr', title: 'PR', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-01', read: false },
      ];
      const result = markAsRead(notifications, ['1']);
      expect(result[0].read).toBe(true);
      expect(result[1].read).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', () => {
      const notifications = [
        { id: '1', type: 'new-issue', title: 'Issue 1', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-01', read: false },
        { id: '2', type: 'new-pr', title: 'PR', message: '', priority: 'normal' as const, channels: ['email'] as const[], recipient: 'u', createdAt: '2024-01-01', read: true },
      ];
      expect(getUnreadCount(notifications)).toBe(1);
    });
  });
});
