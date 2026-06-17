export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationChannel = "in_app" | "email" | "webhook" | "slack";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  channel: NotificationChannel;
  enabled: boolean;
  types: NotificationType[];
  minSeverity?: NotificationType;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private preferences: Map<NotificationChannel, NotificationPreferences> = new Map();
  private listeners: ((notification: Notification) => void)[] = [];

  constructor() {
    // Default preferences
    this.setPreferences("in_app", { channel: "in_app", enabled: true, types: ["info", "success", "warning", "error"] });
    this.setPreferences("email", { channel: "email", enabled: false, types: ["warning", "error"] });
    this.setPreferences("webhook", { channel: "webhook", enabled: false, types: ["warning", "error"] });
    this.setPreferences("slack", { channel: "slack", enabled: false, types: ["error"] });
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  notify(
    type: NotificationType,
    title: string,
    message: string,
    channel: NotificationChannel = "in_app",
    metadata?: Record<string, unknown>
  ): Notification | null {
    const preference = this.preferences.get(channel);
    
    // Check if notification should be sent
    if (!preference?.enabled || !preference.types.includes(type)) {
      return null;
    }

    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      channel,
      metadata,
    };

    this.notifications.unshift(notification);
    this.listeners.forEach((listener) => listener(notification));

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    return notification;
  }

  getNotifications(options?: {
    channel?: NotificationChannel;
    type?: NotificationType;
    unreadOnly?: boolean;
    limit?: number;
  }): Notification[] {
    let result = [...this.notifications];

    if (options?.channel) {
      result = result.filter((n) => n.channel === options.channel);
    }
    if (options?.type) {
      result = result.filter((n) => n.type === options.type);
    }
    if (options?.unreadOnly) {
      result = result.filter((n) => !n.read);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  markAsRead(id: string): boolean {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }

  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  clearAll(): void {
    this.notifications = [];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  setPreferences(channel: NotificationChannel, prefs: NotificationPreferences): void {
    this.preferences.set(channel, prefs);
  }

  getPreferences(channel: NotificationChannel): NotificationPreferences | undefined {
    return this.preferences.get(channel);
  }

  getAllPreferences(): NotificationPreferences[] {
    return Array.from(this.preferences.values());
  }

  subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Pre-defined notification helpers
  notifySuccess(title: string, message: string, metadata?: Record<string, unknown>): Notification | null {
    return this.notify("success", title, message, "in_app", metadata);
  }

  notifyError(title: string, message: string, metadata?: Record<string, unknown>): Notification | null {
    return this.notify("error", title, message, "in_app", metadata);
  }

  notifyWarning(title: string, message: string, metadata?: Record<string, unknown>): Notification | null {
    return this.notify("warning", title, message, "in_app", metadata);
  }

  notifyInfo(title: string, message: string, metadata?: Record<string, unknown>): Notification | null {
    return this.notify("info", title, message, "in_app", metadata);
  }

  // Notify about repository events
  notifyNewIssue(repoFullName: string, issueNumber: number, issueTitle: string): Notification | null {
    return this.notify(
      "info",
      "New Issue",
      `${repoFullName}#${issueNumber}: ${issueTitle}`,
      "in_app",
      { type: "issue", repoFullName, issueNumber }
    );
  }

  notifyNewPR(repoFullName: string, prNumber: number, prTitle: string): Notification | null {
    return this.notify(
      "info",
      "New Pull Request",
      `${repoFullName}#${prNumber}: ${prTitle}`,
      "in_app",
      { type: "pr", repoFullName, prNumber }
    );
  }

  notifyPRMerged(repoFullName: string, prNumber: number, prTitle: string): Notification | null {
    return this.notify(
      "success",
      "PR Merged",
      `${repoFullName}#${prNumber}: ${prTitle}`,
      "in_app",
      { type: "pr_merged", repoFullName, prNumber }
    );
  }

  notifyStaleIssue(repoFullName: string, issueNumber: number, daysStale: number): Notification | null {
    return this.notify(
      "warning",
      "Stale Issue",
      `${repoFullName}#${issueNumber} has been stale for ${daysStale} days`,
      "in_app",
      { type: "stale_issue", repoFullName, issueNumber, daysStale }
    );
  }
}

export const notificationManager = new NotificationManager();
export { NotificationManager };
