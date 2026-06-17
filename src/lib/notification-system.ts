/**
 * Notification System - Manage and route notifications
 */

export type NotificationChannel = 'email' | 'slack' | 'discord' | 'webhook' | 'in_app';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  recipient: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    [K in NotificationChannel]?: {
      enabled: boolean;
      events: string[];
      frequency?: 'instant' | 'hourly' | 'daily' | 'weekly';
    };
  };
  quietHours?: {
    start: string; // HH:mm
    end: string;
    timezone: string;
  };
  filters: {
    ignoreOwnActions: boolean;
    minPriority: NotificationPriority;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  channels: NotificationChannel[];
}

export const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'new-issue',
    name: 'New Issue',
    subject: '[{{repo}}] New Issue: {{title}}',
    body: '**Issue #{{number}}** opened by @{{author}}\n\n{{body}}',
    channels: ['email', 'slack', 'in_app'],
  },
  {
    id: 'new-pr',
    name: 'New Pull Request',
    subject: '[{{repo}}] New PR: {{title}}',
    body: '**PR #{{number}}** opened by @{{author}}\n\n{{body}}',
    channels: ['email', 'slack', 'in_app'],
  },
  {
    id: 'pr-merged',
    name: 'PR Merged',
    subject: '[{{repo}}] PR Merged: {{title}}',
    body: '**PR #{{number}}** by @{{author}} has been merged! 🎉',
    channels: ['in_app'],
  },
  {
    id: 'mention',
    name: 'Mention',
    subject: '[{{repo}}] You were mentioned',
    body: '@{{mentionedBy}} mentioned you in **{{context}}**',
    channels: ['email', 'slack', 'in_app'],
  },
  {
    id: 'security-alert',
    name: 'Security Alert',
    subject: '🚨 Security Alert: {{repo}}',
    body: 'A security vulnerability has been detected. Immediate attention required.',
    channels: ['email', 'slack', 'webhook', 'in_app'],
  },
];

export function createNotification(
  type: string,
  data: Record<string, string>,
  preferences: NotificationPreferences
): Notification | null {
  const template = DEFAULT_TEMPLATES.find(t => t.id === type);
  if (!template) return null;

  // Check if user wants this notification
  const enabledChannels = template.channels.filter(ch => 
    preferences.channels[ch]?.enabled && 
    preferences.channels[ch]?.events?.includes(type)
  );

  if (enabledChannels.length === 0) return null;

  // Check quiet hours
  if (preferences.quietHours) {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { timeZone: preferences.quietHours.timezone, hour: '2-digit', minute: '2-digit' });
    if (isInQuietHours(currentTime, preferences.quietHours.start, preferences.quietHours.end)) {
      return null;
    }
  }

  const subject = interpolate(template.subject, data);
  const message = interpolate(template.body, data);

  return {
    id: generateId(),
    type,
    title: subject,
    message,
    priority: type === 'security-alert' ? 'urgent' : 'normal',
    channels: enabledChannels,
    recipient: preferences.userId,
    createdAt: new Date().toISOString(),
    read: false,
    metadata: data,
  };
}

function interpolate(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
}

function isInQuietHours(current: string, start: string, end: string): boolean {
  return current >= start && current <= end;
}

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function filterNotifications(
  notifications: Notification[],
  filters: { priority?: NotificationPriority; channels?: NotificationChannel[]; unreadOnly?: boolean }
): Notification[] {
  return notifications.filter(n => {
    if (filters.unreadOnly && n.read) return false;
    if (filters.priority && getPriorityLevel(n.priority) < getPriorityLevel(filters.priority)) return false;
    if (filters.channels && !filters.channels.some(ch => n.channels.includes(ch))) return false;
    return true;
  });
}

function getPriorityLevel(priority: NotificationPriority): number {
  const levels: Record<NotificationPriority, number> = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };
  return levels[priority];
}

export function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  return notifications.reduce((groups, n) => {
    const date = new Date(n.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
    return groups;
  }, {} as Record<string, Notification[]>);
}

export function markAsRead(notifications: Notification[], ids: string[]): Notification[] {
  return notifications.map(n => 
    ids.includes(n.id) ? { ...n, read: true } : n
  );
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.read).length;
}

/**
 * NotificationManager - Class-based API for notification management
 */
export class NotificationManager {
  private notifications: Notification[] = [];

  constructor(initialNotifications?: Notification[]) {
    this.notifications = initialNotifications || [];
  }

  notify(
    severity: "info" | "success" | "warning" | "error",
    title: string,
    message: string,
    channel: NotificationChannel = "in_app"
  ): void {
    const notification: Notification = {
      id: generateId(),
      type: severity,
      title,
      message,
      priority: severity === "error" ? "urgent" : severity === "warning" ? "high" : "normal",
      channels: [channel],
      recipient: "system",
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
  }

  getNotifications(options?: {
    unreadOnly?: boolean;
    channel?: NotificationChannel;
    limit?: number;
  }): Notification[] {
    let result = [...this.notifications];
    if (options?.unreadOnly) {
      result = result.filter(n => !n.read);
    }
    if (options?.channel) {
      result = result.filter(n => n.channels.includes(options.channel!));
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    return result;
  }

  markAsRead(ids: string[]): void {
    this.notifications = this.notifications.map(n =>
      ids.includes(n.id) ? { ...n, read: true } : n
    );
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}
