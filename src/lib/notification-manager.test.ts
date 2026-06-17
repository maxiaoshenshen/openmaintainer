import { describe, it, expect } from 'vitest';
import {
  createNotification,
  markAsSent,
  markAsRead,
  createPreference,
  shouldSendNotification,
  createTemplate,
  renderTemplate,
  calculateStats,
  groupByChannel,
  filterByPriority,
  getUnreadCount
} from './notification-manager';

describe('notification-manager', () => {
  describe('createNotification', () => {
    it('should create a notification', () => {
      const notif = createNotification('Test', 'Hello', 'email', ['user@test.com']);
      expect(notif.title).toBe('Test');
      expect(notif.channel).toBe('email');
      expect(notif.recipients).toEqual(['user@test.com']);
    });
  });

  describe('markAsSent', () => {
    it('should mark notification as sent', () => {
      const notif = createNotification('Test', 'Hello', 'slack', ['user']);
      const sent = markAsSent(notif);
      expect(sent.sentAt).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notif = createNotification('Test', 'Hello', 'slack', ['user']);
      const read = markAsRead(notif);
      expect(read.readAt).toBeDefined();
    });
  });

  describe('createPreference', () => {
    it('should create notification preference', () => {
      const pref = createPreference('user1', 'email', true, 'daily');
      expect(pref.userId).toBe('user1');
      expect(pref.digestMode).toBe('daily');
    });
  });

  describe('shouldSendNotification', () => {
    it('should respect preference settings', () => {
      const pref = createPreference('user1', 'email', false);
      expect(shouldSendNotification(pref, 'normal')).toBe(false);
      
      const pref2 = createPreference('user1', 'email', true);
      expect(shouldSendNotification(pref2, 'high')).toBe(true);
    });
  });

  describe('createTemplate', () => {
    it('should extract variables from template', () => {
      const tmpl = createTemplate('welcome', 'Hello {{name}}, welcome to {{repo}}!');
      expect(tmpl.variables).toContain('name');
      expect(tmpl.variables).toContain('repo');
    });
  });

  describe('renderTemplate', () => {
    it('should replace variables', () => {
      const tmpl = createTemplate('welcome', 'Hello {{name}}!');
      const rendered = renderTemplate(tmpl, { name: 'Alice' });
      expect(rendered.body).toBe('Hello Alice!');
    });
  });

  describe('calculateStats', () => {
    it('should calculate notification statistics', () => {
      const notifications = [
        createNotification('A', 'A', 'email', ['u'], 'normal'),
        createNotification('B', 'B', 'slack', ['u'], 'high')
      ];
      const stats = calculateStats(notifications.map(markAsSent));
      expect(stats.totalSent).toBe(2);
      expect(stats.delivered).toBe(2);
    });
  });

  describe('groupByChannel', () => {
    it('should group notifications by channel', () => {
      const notifications = [
        createNotification('A', 'A', 'email', ['u']),
        createNotification('B', 'B', 'slack', ['u'])
      ];
      const grouped = groupByChannel(notifications);
      expect(grouped.email).toHaveLength(1);
      expect(grouped.slack).toHaveLength(1);
    });
  });

  describe('filterByPriority', () => {
    it('should filter by minimum priority', () => {
      const notifications = [
        createNotification('Low', 'A', 'email', ['u'], 'low'),
        createNotification('High', 'B', 'email', ['u'], 'high')
      ];
      const filtered = filterByPriority(notifications, 'high');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('High');
    });
  });

  describe('getUnreadCount', () => {
    it('should count unread notifications', () => {
      const notifications = [
        createNotification('A', 'A', 'email', ['u']),
        markAsRead(createNotification('B', 'B', 'email', ['u']))
      ];
      expect(getUnreadCount(notifications)).toBe(1);
    });
  });
});
