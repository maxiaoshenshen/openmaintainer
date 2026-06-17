import type { Repository, Issue, PullRequest } from './types';

/**
 * Notification System - Manages maintainer notifications
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  dismissed: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType = 
  | 'pr-review-request'
  | 'pr-approved'
  | 'pr-merged'
  | 'pr-comments'
  | 'issue-opened'
  | 'issue-comments'
  | 'mention'
  | 'ci-failed'
  | 'security-alert'
  | 'dependency-update'
  | 'star-milestone'
  | 'contributor-joined';

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<string, number>;
  urgentItems: Notification[];
}

export function createNotificationSystem() {
  const generateNotifications = (
    repo: Repository,
    issues: Issue[],
    pullRequests: PullRequest[]
  ): Notification[] => {
    const notifications: Notification[] = [];
    const now = Date.now();

    // PR notifications
    pullRequests.forEach((pr, i) => {
      notifications.push({
        id: `pr-review-${pr.id}`,
        type: 'pr-review-request',
        title: `Review requested: #${pr.number}`,
        message: `${pr.title} by ${pr.author}`,
        priority: pr.additions > 100 ? 'high' : 'medium',
        read: i > 0,
        dismissed: false,
        createdAt: new Date(now - i * 3600000),
        actionUrl: `/pulls/${pr.number}`
      });

      if (i === 0) {
        notifications.push({
          id: `pr-comments-${pr.id}`,
          type: 'pr-comments',
          title: `New comments on #${pr.number}`,
          message: '5 new comments require your attention',
          priority: 'medium',
          read: false,
          dismissed: false,
          createdAt: new Date(now - 1800000)
        });
      }
    });

    // Issue notifications
    issues.forEach((issue, i) => {
      if (i < 2) {
        notifications.push({
          id: `issue-${issue.id}`,
          type: 'issue-opened',
          title: `New issue: #${issue.number}`,
          message: `${issue.title} by ${issue.author}`,
          priority: 'medium',
          read: false,
          dismissed: false,
          createdAt: new Date(now - i * 7200000)
        });
      }
    });

    // System notifications
    notifications.push(
      {
        id: 'ci-failed-1',
        type: 'ci-failed',
        title: 'CI/CD pipeline failed',
        message: 'Build #123 failed on main branch',
        priority: 'urgent',
        read: false,
        dismissed: false,
        createdAt: new Date(now - 900000),
        actionUrl: '/actions'
      },
      {
        id: 'security-1',
        type: 'security-alert',
        title: 'Security vulnerability detected',
        message: 'Critical vulnerability in lodash < 4.17.21',
        priority: 'urgent',
        read: false,
        dismissed: false,
        createdAt: new Date(now - 3600000),
        actionUrl: '/security'
      },
      {
        id: 'star-1',
        type: 'star-milestone',
        title: '🎉 1,000 stars!',
        message: 'Congratulations! Your repo reached 1,000 stars',
        priority: 'low',
        read: true,
        dismissed: false,
        createdAt: new Date(now - 86400000)
      }
    );

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const summarize = (notifications: Notification[]): NotificationSummary => {
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: byType as Record<NotificationType, number>,
      byPriority,
      urgentItems: notifications.filter(n => n.priority === 'urgent' && !n.read)
    };
  };

  const markAsRead = (notifications: Notification[], id: string): Notification[] => {
    return notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
  };

  const markAllAsRead = (notifications: Notification[]): Notification[] => {
    return notifications.map(n => ({ ...n, read: true }));
  };

  const dismiss = (notifications: Notification[], id: string): Notification[] => {
    return notifications.map(n =>
      n.id === id ? { ...n, dismissed: true } : n
    );
  };

  const getUnreadCount = (notifications: Notification[]): number => {
    return notifications.filter(n => !n.read && !n.dismissed).length;
  };

  const getPriorityIcon = (priority: Notification['priority']): string => {
    const icons = { low: '📬', medium: '📬', high: '🚨', urgent: '🔴' };
    return icons[priority];
  };

  const getTypeIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      'pr-review-request': '👀',
      'pr-approved': '✅',
      'pr-merged': '🔀',
      'pr-comments': '💬',
      'issue-opened': '📝',
      'issue-comments': '💬',
      'mention': '@',
      'ci-failed': '❌',
      'security-alert': '🔒',
      'dependency-update': '📦',
      'star-milestone': '⭐',
      'contributor-joined': '👋'
    };
    return icons[type];
  };

  return {
    generateNotifications,
    summarize,
    markAsRead,
    markAllAsRead,
    dismiss,
    getUnreadCount,
    getPriorityIcon,
    getTypeIcon,
    notificationTypes: [
      'pr-review-request', 'pr-approved', 'pr-merged', 'pr-comments',
      'issue-opened', 'issue-comments', 'mention', 'ci-failed',
      'security-alert', 'dependency-update', 'star-milestone', 'contributor-joined'
    ] as const,
    priorities: ['low', 'medium', 'high', 'urgent'] as const
  };
}

// Legacy class-based API for EventProcessor compatibility
export class NotificationManager {
  private notifications: Array<{ severity: string; title: string; message: string; channel: string }> = [];

  notify(severity: string, title: string, message: string, channel: string = 'in_app'): void {
    this.notifications.push({ severity, title, message, channel });
  }

  getNotifications(): Array<{ severity: string; title: string; message: string; channel: string }> {
    return this.notifications;
  }

  clear(): void {
    this.notifications = [];
  }
}
