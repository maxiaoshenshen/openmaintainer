/**
 * Notification Manager
 * Handles notification preferences and delivery for maintainers
 */

export type NotificationChannel = 'email' | 'slack' | 'discord' | 'telegram' | 'webhook';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationEvent = 
  | 'pr_review_requested'
  | 'pr_approved'
  | 'pr_merged'
  | 'pr_rejected'
  | 'issue_opened'
  | 'issue_assigned'
  | 'issue_closed'
  | 'comment_added'
  | 'mention'
  | 'security_alert'
  | 'dependency_update'
  | 'stale_warning'
  | 'milestone_due'
  | 'contributor_joined'
  | 'burnout_warning';

export interface NotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  email?: string;
  slackWebhook?: string;
  discordWebhook?: string;
  telegramChatId?: string;
  webhookUrl?: string;
  events: Partial<Record<NotificationEvent, {
    enabled: boolean;
    priority: NotificationPriority;
    channel?: NotificationChannel;
  }>>;
  quietHours?: {
    start: string; // HH:mm
    end: string;
    timezone: string;
  };
  digestMode: 'instant' | 'hourly' | 'daily' | 'weekly';
}

export interface Notification {
  id: string;
  userId: string;
  event: NotificationEvent;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface NotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
}

/**
 * Get default notification preferences
 */
export function getDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    channels: ['email'],
    digestMode: 'instant',
    events: {
      pr_review_requested: { enabled: true, priority: 'high' },
      pr_approved: { enabled: true, priority: 'medium' },
      pr_merged: { enabled: true, priority: 'low' },
      pr_rejected: { enabled: true, priority: 'medium' },
      issue_opened: { enabled: true, priority: 'medium' },
      issue_assigned: { enabled: true, priority: 'high' },
      issue_closed: { enabled: true, priority: 'low' },
      comment_added: { enabled: true, priority: 'low' },
      mention: { enabled: true, priority: 'high' },
      security_alert: { enabled: true, priority: 'urgent', channel: 'email' },
      dependency_update: { enabled: true, priority: 'medium' },
      stale_warning: { enabled: true, priority: 'medium' },
      milestone_due: { enabled: true, priority: 'high' },
      contributor_joined: { enabled: true, priority: 'low' },
      burnout_warning: { enabled: true, priority: 'urgent', channel: 'email' },
    },
  };
}

/**
 * Check if notification should be sent based on quiet hours
 */
export function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHours) return false;
  
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: preferences.quietHours.timezone,
  });
  
  const currentTime = formatter.format(now);
  const { start, end } = preferences.quietHours;
  
  if (start <= end) {
    return currentTime >= start && currentTime <= end;
  } else {
    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    return currentTime >= start || currentTime <= end;
  }
}

/**
 * Determine which channels to use for a notification
 */
export function getNotificationChannels(
  event: NotificationEvent,
  preferences: NotificationPreferences,
  notificationPriority: NotificationPriority
): NotificationChannel[] {
  const eventPref = preferences.events[event];
  
  if (!eventPref?.enabled) return [];
  
  // Urgent notifications always use all channels
  if (notificationPriority === 'urgent' || eventPref.priority === 'urgent') {
    return preferences.channels;
  }
  
  // Use event-specific channel or all channels
  return eventPref.channel ? [eventPref.channel] : preferences.channels;
}

/**
 * Format notification for email delivery
 */
export function formatEmailNotification(
  notification: Notification,
  preferences: NotificationPreferences
): { subject: string; body: string; html: string } {
  const priorityEmoji = {
    low: '',
    medium: '[Medium Priority] ',
    high: '[High Priority] ',
    urgent: '[URGENT] ',
  };
  
  const subject = `${priorityEmoji[notification.priority]}${notification.title}`;
  
  const plainBody = `
${notification.message}

---
View details: ${(notification.data.url as string) || 'N/A'}
Priority: ${notification.priority}
Time: ${new Date(notification.createdAt).toLocaleString()}

Manage notifications: [Notification Settings]
`.trim();
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .priority-${notification.priority} { 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-size: 12px;
      ${notification.priority === 'urgent' ? 'background: #dc2626; color: white;' : ''}
      ${notification.priority === 'high' ? 'background: #f59e0b; color: white;' : ''}
      ${notification.priority === 'medium' ? 'background: #3b82f6; color: white;' : ''}
    }
    .footer { color: #666; font-size: 12px; margin-top: 20px; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
  <h2>${notification.title}</h2>
  <p>${notification.message}</p>
  <p>Priority: <span class="priority-${notification.priority}">${notification.priority.toUpperCase()}</span></p>
  ${notification.data.url ? `<p><a href="${notification.data.url}">View Details →</a></p>` : ''}
  <p class="footer">
    Sent at ${new Date(notification.createdAt).toLocaleString()}<br>
    <a href="#">Manage notification preferences</a>
  </p>
</body>
</html>
`.trim();
  
  return { subject, body: plainBody, html: htmlBody };
}

/**
 * Format notification for Slack delivery
 */
export function formatSlackNotification(notification: Notification): {
  blocks: unknown[];
  text: string;
} {
  const priorityColor = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#dc2626',
  };
  
  const text = `${notification.title}: ${notification.message}`;
  
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: notification.title, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: notification.message },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*Priority:* ${notification.priority.toUpperCase()} | *Time:* ${new Date(notification.createdAt).toLocaleString()}`,
        },
      ],
    },
  ];
  
  if (notification.data.url) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Details', emoji: true },
          url: notification.data.url as string,
        },
      ],
    });
  }
  
  return { blocks, text };
}

/**
 * Build webhook payload for external integrations
 */
export function buildWebhookPayload(
  notification: Notification,
  channel: NotificationChannel
): Record<string, unknown> {
  const base = {
    event: notification.event,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    timestamp: notification.createdAt,
  };
  
  switch (channel) {
    case 'discord':
      return {
        embeds: [{
          title: notification.title,
          description: notification.message,
          color: notification.priority === 'urgent' ? 15158332 : notification.priority === 'high' ? 15105570 : 3447003,
          fields: [
            { name: 'Priority', value: notification.priority, inline: true },
            { name: 'Event', value: notification.event, inline: true },
          ],
          timestamp: notification.createdAt,
          url: notification.data.url as string,
        }],
      };
    
    case 'telegram':
      const priorityPrefix = notification.priority === 'urgent' ? '🚨 ' : notification.priority === 'high' ? '⚠️ ' : '';
      return {
        text: `${priorityPrefix}*${notification.title}*\n\n${notification.message}\n\nPriority: ${notification.priority}\n[View Details](${notification.data.url || ''})`,
        parse_mode: 'Markdown',
      };
    
    default:
      return base;
  }
}

/**
 * Filter notifications for digest
 */
export function filterForDigest(
  notifications: Notification[],
  preferences: NotificationPreferences
): Notification[] {
  const now = new Date();
  const cutoffHours = {
    hourly: 1,
    daily: 24,
    weekly: 168,
  };
  
  const hours = cutoffHours[preferences.digestMode];
  if (!hours) return notifications; // instant mode
  
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
  
  return notifications
    .filter(n => new Date(n.createdAt) >= cutoff)
    .filter(n => n.priority !== 'low' || preferences.events[n.event]?.priority !== 'low');
}

/**
 * Create a digest summary
 */
export function createDigestSummary(notifications: Notification[]): {
  subject: string;
  body: string;
  html: string;
} {
  const byPriority = {
    urgent: notifications.filter(n => n.priority === 'urgent'),
    high: notifications.filter(n => n.priority === 'high'),
    medium: notifications.filter(n => n.priority === 'medium'),
    low: notifications.filter(n => n.priority === 'low'),
  };
  
  const counts = {
    urgent: byPriority.urgent.length,
    high: byPriority.high.length,
    total: notifications.length,
  };
  
  const subject = counts.urgent > 0 
    ? `[URGENT] ${counts.urgent} urgent notification${counts.urgent > 1 ? 's' : ''}`
    : `${counts.total} notifications from OpenMaintainer`;
  
  let body = `You have ${counts.total} notification${counts.total > 1 ? 's' : ''}.\n\n`;
  
  if (byPriority.urgent.length > 0) {
    body += `🚨 URGENT:\n`;
    byPriority.urgent.forEach(n => { body += `  • ${n.title}\n`; });
  }
  
  if (byPriority.high.length > 0) {
    body += `\n⚠️ HIGH PRIORITY:\n`;
    byPriority.high.forEach(n => { body += `  • ${n.title}\n`; });
  }
  
  body += `\nView all notifications in your dashboard.`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .urgent { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0; }
    .high { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
    .priority-label { font-weight: bold; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="summary">
    <h2>Notification Digest</h2>
    <p>${counts.total} notification${counts.total > 1 ? 's' : ''} - ${counts.urgent} urgent, ${counts.high} high priority</p>
  </div>
  
  ${byPriority.urgent.length > 0 ? `
    <div class="urgent">
      <div class="priority-label">🚨 Urgent</div>
      ${byPriority.urgent.map(n => `<p>${n.title}</p>`).join('')}
    </div>
  ` : ''}
  
  ${byPriority.high.length > 0 ? `
    <div class="high">
      <div class="priority-label">⚠️ High Priority</div>
      ${byPriority.high.map(n => `<p>${n.title}</p>`).join('')}
    </div>
  ` : ''}
  
  <p><a href="#">View all in dashboard →</a></p>
</body>
</html>
`.trim();
  
  return { subject, body, html };
}
