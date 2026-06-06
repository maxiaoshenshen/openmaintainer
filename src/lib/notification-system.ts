/**
 * Notification System
 * Manage and prioritize notifications for maintainers
 */

export type NotificationType = 'pr_review' | 'issue_comment' | 'mention' | 'approval' | 'change_request' | 'mention' | 'assignment';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  actor: string;
  repository: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSummary {
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  urgentCount: number;
}

export interface DigestConfig {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quietHours?: { start: string; end: string };
}

/**
 * Determine notification priority based on content
 */
export function getNotificationPriority(notification: Pick<Notification, 'type' | 'title' | 'body'>): NotificationPriority {
  const content = `${notification.title} ${notification.body}`.toLowerCase();
  
  // Urgent keywords
  if (/urgent|critical|security|emergency|asap/i.test(content)) return 'urgent';
  
  // High priority types
  if (['approval', 'change_request', 'mention'].includes(notification.type)) return 'high';
  
  return 'normal';
}

/**
 * Calculate notification summary
 */
export function calculateNotificationSummary(notifications: Notification[]): NotificationSummary {
  const unread = notifications.filter(n => !n.read).length;
  
  const byType: Record<NotificationType, number> = {
    pr_review: 0,
    issue_comment: 0,
    mention: 0,
    approval: 0,
    change_request: 0,
    assignment: 0,
  };
  
  const byPriority: Record<NotificationPriority, number> = {
    urgent: 0,
    high: 0,
    normal: 0,
    low: 0,
  };
  
  notifications.forEach(n => {
    byType[n.type]++;
    byPriority[n.priority]++;
  });
  
  return {
    unread,
    byType,
    byPriority,
    urgentCount: byPriority.urgent,
  };
}

/**
 * Filter notifications by criteria
 */
export function filterNotifications(
  notifications: Notification[],
  filters: {
    type?: NotificationType;
    priority?: NotificationPriority;
    repository?: string;
    unreadOnly?: boolean;
  }
): Notification[] {
  return notifications.filter(n => {
    if (filters.type && n.type !== filters.type) return false;
    if (filters.priority && n.priority !== filters.priority) return false;
    if (filters.repository && n.repository !== filters.repository) return false;
    if (filters.unreadOnly && n.read) return false;
    return true;
  });
}

/**
 * Sort notifications by priority and time
 */
export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    // Unread first
    if (a.read !== b.read) return a.read ? 1 : -1;
    
    // Then by priority
    const priorityOrder: Record<NotificationPriority, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by timestamp (newest first)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

/**
 * Generate notification digest
 */
export function generateNotificationDigest(
  notifications: Notification[],
  config: DigestConfig
): string {
  const summary = calculateNotificationSummary(notifications);
  let digest = '📬 **Notification Digest**\n\n';
  
  if (summary.unread > 0) {
    digest += `You have **${summary.unread}** unread notifications\n\n`;
  }
  
  // Group by type
  const groupedByType = notifications.reduce((acc, n) => {
    if (!acc[n.type]) acc[n.type] = [];
    acc[n.type].push(n);
    return acc;
  }, {} as Record<NotificationType, Notification[]>);
  
  for (const [type, items] of Object.entries(groupedByType)) {
    if (items.length > 0) {
      const typeEmoji: Record<NotificationType, string> = {
        pr_review: '🔍',
        issue_comment: '💬',
        mention: '@️',
        approval: '✅',
        change_request: '⚠️',
        assignment: '📋',
      };
      digest += `**${typeEmoji[type as NotificationType] || '📌'} ${type}** (${items.length})\n`;
    }
  }
  
  return digest;
}

/**
 * Format notification for display
 */
export function formatNotification(notification: Notification): string {
  const typeEmoji: Record<NotificationType, string> = {
    pr_review: '🔍',
    issue_comment: '💬',
    mention: '@️',
    approval: '✅',
    change_request: '⚠️',
    assignment: '📋',
  };
  
  const priorityPrefix = notification.priority === 'urgent' ? '🚨 ' : 
                       notification.priority === 'high' ? '⭐ ' : '';
  
  const readStatus = notification.read ? '' : '• ';
  const timeAgo = getTimeAgo(notification.timestamp);
  
  return `${readStatus}${typeEmoji[notification.type]} **${notification.title}** by ${notification.actor}\n` +
         `   ${notification.body} · ${timeAgo}`;
}

/**
 * Get relative time string
 */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
