export type NotificationChannel = 'email' | 'slack' | 'discord' | 'webhook' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  recipients: string[];
  sentAt?: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  channel: NotificationChannel;
  enabled: boolean;
  digestMode: 'immediate' | 'hourly' | 'daily' | 'weekly';
  filterByPriority: NotificationPriority[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject?: string;
  body: string;
  variables: string[];
}

export interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<NotificationPriority, number>;
}

export function createNotification(
  title: string,
  message: string,
  channel: NotificationChannel,
  recipients: string[],
  priority: NotificationPriority = 'normal',
  metadata?: Record<string, any>
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    channel,
    priority,
    recipients,
    metadata
  };
}

export function markAsSent(notification: Notification): Notification {
  return { ...notification, sentAt: new Date() };
}

export function markAsRead(notification: Notification): Notification {
  return { ...notification, readAt: new Date() };
}

export function createPreference(
  userId: string,
  channel: NotificationChannel,
  enabled: boolean = true,
  digestMode: NotificationPreference['digestMode'] = 'immediate'
): NotificationPreference {
  return {
    userId,
    channel,
    enabled,
    digestMode,
    filterByPriority: ['low', 'normal', 'high', 'urgent']
  };
}

export function shouldSendNotification(
  preference: NotificationPreference,
  priority: NotificationPriority
): boolean {
  if (!preference.enabled) return false;
  return preference.filterByPriority.includes(priority);
}

export function createTemplate(
  name: string,
  body: string,
  subject?: string
): NotificationTemplate {
  const variables = body.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || [];
  return { id: `tmpl-${Date.now()}`, name, subject, body, variables };
}

export function renderTemplate(
  template: NotificationTemplate,
  variables: Record<string, string>
): { subject?: string; body: string } {
  let body = template.body;
  let subject = template.subject;
  
  template.variables.forEach(varName => {
    const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
    const value = variables[varName] || '';
    body = body.replace(regex, value);
    if (subject) subject = subject.replace(regex, value);
  });

  return { subject, body };
}

export function calculateStats(notifications: Notification[]): NotificationStats {
  const stats: NotificationStats = {
    totalSent: notifications.length,
    delivered: notifications.filter(n => n.sentAt).length,
    failed: notifications.filter(n => !n.sentAt).length,
    byChannel: { email: 0, slack: 0, discord: 0, webhook: 0, in_app: 0 },
    byPriority: { low: 0, normal: 0, high: 0, urgent: 0 }
  };

  notifications.forEach(n => {
    stats.byChannel[n.channel]++;
    stats.byPriority[n.priority]++;
  });

  return stats;
}

export function groupByChannel(notifications: Notification[]): Record<NotificationChannel, Notification[]> {
  return notifications.reduce((acc, n) => {
    if (!acc[n.channel]) acc[n.channel] = [];
    acc[n.channel].push(n);
    return acc;
  }, {} as Record<NotificationChannel, Notification[]>);
}

export function filterByPriority(
  notifications: Notification[],
  minPriority: NotificationPriority
): Notification[] {
  const priorityOrder: NotificationPriority[] = ['low', 'normal', 'high', 'urgent'];
  const minIndex = priorityOrder.indexOf(minPriority);
  return notifications.filter(n => priorityOrder.indexOf(n.priority) >= minIndex);
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.readAt).length;
}

export function createDigest(
  notifications: Notification[],
  mode: NotificationPreference['digestMode']
): { title: string; notifications: Notification[]; summary: string } {
  const unread = notifications.filter(n => !n.readAt);
  const modeLabels = { immediate: 'Immediate', hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly' };
  
  return {
    title: `${modeLabels[mode]} Notification Digest`,
    notifications: unread,
    summary: `You have ${unread.length} unread notifications`
  };
}
