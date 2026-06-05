/**
 * Notification Store - Manage repository subscriptions and notifications
 */

export interface NotificationSubscription {
  repository: string;
  subscribedAt: number;
  frequency: "realtime" | "daily" | "weekly";
  channels: ("email" | "webhook" | "rss")[];
}

export interface Notification {
  id: string;
  repository: string;
  type: "pr_merged" | "issue_opened" | "release_published" | "contributor_joined";
  title: string;
  titleZh: string;
  message: string;
  messageZh: string;
  url: string;
  createdAt: number;
  read: boolean;
}

const SUBSCRIPTIONS_KEY = "openmaintainer:subscriptions";
const NOTIFICATIONS_KEY = "openmaintainer:notifications";
const MAX_NOTIFICATIONS = 100;

/**
 * Read all subscriptions
 */
export function readSubscriptions(storage: Storage): NotificationSubscription[] {
  try {
    const data = storage.getItem(SUBSCRIPTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Write subscriptions
 */
export function writeSubscriptions(storage: Storage, subscriptions: NotificationSubscription[]): void {
  storage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
}

/**
 * Add a subscription
 */
export function addSubscription(storage: Storage, repo: string, frequency: NotificationSubscription["frequency"] = "daily"): void {
  const subscriptions = readSubscriptions(storage);
  const existing = subscriptions.findIndex((s) => s.repository === repo);
  if (existing >= 0) {
    subscriptions[existing].frequency = frequency;
  } else {
    subscriptions.push({
      repository: repo,
      subscribedAt: Date.now(),
      frequency,
      channels: ["email"],
    });
  }
  writeSubscriptions(storage, subscriptions);
}

/**
 * Remove a subscription
 */
export function removeSubscription(storage: Storage, repo: string): void {
  const subscriptions = readSubscriptions(storage);
  writeSubscriptions(storage, subscriptions.filter((s) => s.repository !== repo));
}

/**
 * Check if subscribed to a repository
 */
export function isSubscribed(storage: Storage, repo: string): boolean {
  const subscriptions = readSubscriptions(storage);
  return subscriptions.some((s) => s.repository === repo);
}

/**
 * Read all notifications
 */
export function readNotifications(storage: Storage): Notification[] {
  try {
    const data = storage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Add a notification
 */
export function addNotification(storage: Storage, notification: Omit<Notification, "id" | "read" | "createdAt">): void {
  const notifications = readNotifications(storage);
  notifications.unshift({
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    read: false,
    createdAt: Date.now(),
  });
  // Limit notifications
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.length = MAX_NOTIFICATIONS;
  }
  storage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

/**
 * Mark notification as read
 */
export function markNotificationRead(storage: Storage, id: string): void {
  const notifications = readNotifications(storage);
  notifications.forEach((n) => {
    if (n.id === id) n.read = true;
  });
  storage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsRead(storage: Storage): void {
  const notifications = readNotifications(storage);
  notifications.forEach((n) => {
    n.read = true;
  });
  storage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

/**
 * Clear all notifications
 */
export function clearNotifications(storage: Storage): void {
  storage.removeItem(NOTIFICATIONS_KEY);
}

/**
 * Get unread notification count
 */
export function getUnreadCount(storage: Storage): number {
  return readNotifications(storage).filter((n) => !n.read).length;
}

/**
 * Generate RSS feed for subscriptions
 */
export function generateRSSFeed(subscriptions: NotificationSubscription[], notifications: Notification[]): string {
  const items = notifications
    .filter((n) => subscriptions.some((s) => s.repository === n.repository))
    .slice(0, 20)
    .map((n) => `
    <item>
      <title>${n.title}</title>
      <link>${n.url}</link>
      <description>${n.message}</description>
      <pubDate>${new Date(n.createdAt).toISOString()}</pubDate>
    </item>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>OpenMaintainer Notifications</title>
    <link>https://openmaintainer.vercel.app</link>
    <description>Repository notifications from OpenMaintainer</description>
    ${items}
  </channel>
</rss>`;
}
