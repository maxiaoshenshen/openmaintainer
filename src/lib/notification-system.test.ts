import { describe, it, expect } from 'vitest';
import { createNotificationSystem } from './notification-system';

describe('notification-system', () => {
  const { generateNotifications, summarize, markAsRead, getUnreadCount, getPriorityIcon } = createNotificationSystem();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  const mockIssues = [
    { id: '1', number: 1, title: 'Bug', state: 'open' as const, body: '', author: 'user1', labels: [], assignees: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: 0 },
    { id: '2', number: 2, title: 'Feature', state: 'open' as const, body: '', author: 'user2', labels: [], assignees: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: 0 }
  ];

  const mockPRs = [
    { id: '1', number: 1, title: 'Fix bug', state: 'open' as const, additions: 50, deletions: 10, changedFiles: 3, author: 'contrib1', labels: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  describe('generateNotifications', () => {
    it('should generate notifications', () => {
      const notifications = generateNotifications(mockRepo, mockIssues, mockPRs);
      
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0]).toHaveProperty('id');
      expect(notifications[0]).toHaveProperty('type');
      expect(notifications[0]).toHaveProperty('priority');
      expect(notifications[0]).toHaveProperty('read');
    });

    it('should sort by creation date descending', () => {
      const notifications = generateNotifications(mockRepo, mockIssues, mockPRs);
      
      for (let i = 1; i < notifications.length; i++) {
        expect(notifications[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(notifications[i].createdAt.getTime());
      }
    });
  });

  describe('summarize', () => {
    it('should generate summary', () => {
      const notifications = generateNotifications(mockRepo, mockIssues, mockPRs);
      const summary = summarize(notifications);
      
      expect(summary.total).toBe(notifications.length);
      expect(summary.unread).toBeGreaterThanOrEqual(0);
      expect(summary.byType).toBeDefined();
      expect(summary.urgentItems).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notifications = generateNotifications(mockRepo, mockIssues, mockPRs);
      const firstId = notifications[0].id;
      const updated = markAsRead(notifications, firstId);
      
      expect(updated.find(n => n.id === firstId)?.read).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', () => {
      const notifications = generateNotifications(mockRepo, mockIssues, mockPRs);
      const count = getUnreadCount(notifications);
      
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(notifications.length);
    });
  });

  describe('getPriorityIcon', () => {
    it('should return icons for priorities', () => {
      expect(getPriorityIcon('low')).toBe('📬');
      expect(getPriorityIcon('urgent')).toBe('🔴');
    });
  });
});
