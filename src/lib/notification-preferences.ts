export type NotificationChannel = 'email' | 'slack' | 'discord' | 'webhook' | 'in_app';

export type NotificationEvent = 
  | 'pr_opened' | 'pr_merged' | 'pr_closed' | 'pr_review_requested'
  | 'issue_opened' | 'issue_closed' | 'issue_assigned'
  | 'comment_added' | 'mention' | 'ci_passed' | 'ci_failed'
  | 'release_published' | 'security_advisory' | 'dependency_update';

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  frequency: NotificationFrequency;
  enabled: boolean;
  quietHours?: {
    start: string; // HH:mm
    end: string;
  };
  filters?: {
    priority?: 'critical' | 'high' | 'medium' | 'low' | 'all';
    author?: string[];
    labels?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationProfile {
  userId: string;
  email?: string;
  slackWebhook?: string;
  discordWebhook?: string;
  customWebhook?: string;
  timezone: string;
  language: string;
  createdAt: Date;
}

export interface NotificationSummary {
  totalSent: number;
  byChannel: Record<NotificationChannel, number>;
  byEvent: Record<NotificationEvent, number>;
  deliveryRate: number;
}

export class NotificationPreferencesManager {
  private preferences: Map<string, NotificationPreference> = new Map();
  private profiles: Map<string, UserNotificationProfile> = new Map();
  private sentNotifications: Map<string, { channel: NotificationChannel; event: NotificationEvent; sentAt: Date }[]> = new Map();

  async createPreference(data: {
    userId: string;
    channel: NotificationChannel;
    event: NotificationEvent;
    frequency?: NotificationFrequency;
    filters?: NotificationPreference['filters'];
    quietHours?: NotificationPreference['quietHours'];
  }): Promise<NotificationPreference> {
    const id = `PREF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const preference: NotificationPreference = {
      id,
      userId: data.userId,
      channel: data.channel,
      event: data.event,
      frequency: data.frequency || 'immediate',
      enabled: true,
      filters: data.filters,
      quietHours: data.quietHours,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.preferences.set(id, preference);
    return preference;
  }

  async updatePreference(id: string, updates: Partial<NotificationPreference>): Promise<NotificationPreference | null> {
    const pref = this.preferences.get(id);
    if (!pref) return null;

    Object.assign(pref, updates, { updatedAt: new Date() });
    return pref;
  }

  async deletePreference(id: string): Promise<boolean> {
    return this.preferences.delete(id);
  }

  async getPreference(id: string): Promise<NotificationPreference | null> {
    return this.preferences.get(id) || null;
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    return Array.from(this.preferences.values()).filter(p => p.userId === userId);
  }

  async getEnabledPreferences(event: NotificationEvent): Promise<NotificationPreference[]> {
    return Array.from(this.preferences.values()).filter(
      p => p.event === event && p.enabled
    );
  }

  async createProfile(data: {
    userId: string;
    email?: string;
    slackWebhook?: string;
    discordWebhook?: string;
    customWebhook?: string;
    timezone?: string;
    language?: string;
  }): Promise<UserNotificationProfile> {
    const profile: UserNotificationProfile = {
      userId: data.userId,
      email: data.email,
      slackWebhook: data.slackWebhook,
      discordWebhook: data.discordWebhook,
      customWebhook: data.customWebhook,
      timezone: data.timezone || 'UTC',
      language: data.language || 'en',
      createdAt: new Date(),
    };

    this.profiles.set(data.userId, profile);
    return profile;
  }

  async getProfile(userId: string): Promise<UserNotificationProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async updateProfile(userId: string, updates: Partial<UserNotificationProfile>): Promise<UserNotificationProfile | null> {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    Object.assign(profile, updates);
    return profile;
  }

  async recordNotification(
    userId: string,
    channel: NotificationChannel,
    event: NotificationEvent
  ): Promise<void> {
    const key = `${userId}-${channel}`;
    const notifications = this.sentNotifications.get(key) || [];
    notifications.push({ channel, event, sentAt: new Date() });
    
    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.shift();
    }
    
    this.sentNotifications.set(key, notifications);
  }

  async shouldNotify(preference: NotificationPreference): Promise<boolean> {
    if (!preference.enabled) return false;

    // Check quiet hours
    if (preference.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (this.isWithinQuietHours(currentTime, preference.quietHours)) {
        return false;
      }
    }

    return true;
  }

  private isWithinQuietHours(current: string, quietHours: { start: string; end: string }): boolean {
    return current >= quietHours.start && current <= quietHours.end;
  }

  async getSummary(userId?: string): Promise<NotificationSummary> {
    const allNotifications: Array<{ channel: NotificationChannel; event: NotificationEvent }> = [];
    
    for (const notifications of this.sentNotifications.values()) {
      for (const n of notifications) {
        if (!userId) {
          allNotifications.push(n);
        }
      }
    }

    const byChannel: Record<NotificationChannel, number> = {
      email: 0, slack: 0, discord: 0, webhook: 0, in_app: 0,
    };
    
    const byEvent: Record<NotificationEvent, number> = {
      pr_opened: 0, pr_merged: 0, pr_closed: 0, pr_review_requested: 0,
      issue_opened: 0, issue_closed: 0, issue_assigned: 0,
      comment_added: 0, mention: 0, ci_passed: 0, ci_failed: 0,
      release_published: 0, security_advisory: 0, dependency_update: 0,
    };

    allNotifications.forEach(n => {
      byChannel[n.channel]++;
      byEvent[n.event]++;
    });

    return {
      totalSent: allNotifications.length,
      byChannel,
      byEvent,
      deliveryRate: allNotifications.length > 0 ? 0.95 : 0,
    };
  }

  async enableAll(userId: string): Promise<void> {
    const prefs = await this.getUserPreferences(userId);
    for (const pref of prefs) {
      pref.enabled = true;
      pref.updatedAt = new Date();
    }
  }

  async disableAll(userId: string): Promise<void> {
    const prefs = await this.getUserPreferences(userId);
    for (const pref of prefs) {
      pref.enabled = false;
      pref.updatedAt = new Date();
    }
  }

  async bulkCreate(data: {
    userId: string;
    channels: NotificationChannel[];
    events: NotificationEvent[];
    frequency?: NotificationFrequency;
  }): Promise<NotificationPreference[]> {
    const preferences: NotificationPreference[] = [];

    for (const channel of data.channels) {
      for (const event of data.events) {
        const pref = await this.createPreference({
          userId: data.userId,
          channel,
          event,
          frequency: data.frequency,
        });
        preferences.push(pref);
      }
    }

    return preferences;
  }
}
