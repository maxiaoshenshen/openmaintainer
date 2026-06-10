// Notification Preferences for OpenMaintainer
// Manages user notification settings and channels

export type NotificationChannel = 'email' | 'slack' | 'discord' | 'telegram' | 'webhook' | 'in-app';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface NotificationEvent {
  type: string;
  enabled: boolean;
  channels: NotificationChannel[];
  priority: NotificationPriority;
}

export interface NotificationPreferences {
  userId: string;
  events: Map<string, NotificationEvent>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  batchSettings: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
  globalEnabled: boolean;
}

export interface NotificationTemplate {
  eventType: string;
  subject: string;
  body: string;
  channels: NotificationChannel[];
}

class NotificationPreferencesManager {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initDefaultTemplates();
  }

  private initDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        eventType: 'new_issue',
        subject: 'New Issue: {{title}}',
        body: 'A new issue "{{title}}" was opened by {{author}} on {{repository}}.\n\nPriority: {{priority}}\nLabels: {{labels}}',
        channels: ['email', 'in-app'],
      },
      {
        eventType: 'new_pr',
        subject: 'New Pull Request: {{title}}',
        body: 'A new pull request "{{title}}" was opened by {{author}} on {{repository}}.\n\nReviewers: {{reviewers}}\nBranch: {{head}} → {{base}}',
        channels: ['email', 'slack', 'in-app'],
      },
      {
        eventType: 'pr_merged',
        subject: 'PR Merged: {{title}}',
        body: 'Pull request "{{title}}" was merged into {{repository}}.\n\nAdded: +{{additions}} | Removed: -{{deletions}}',
        channels: ['in-app'],
      },
      {
        eventType: 'security_alert',
        subject: '⚠️ Security Alert: {{repository}}',
        body: 'A security vulnerability was detected in {{repository}}.\n\nSeverity: {{severity}}\nPackage: {{package}}\nDescription: {{description}}',
        channels: ['email', 'slack', 'discord', 'telegram'],
      },
      {
        eventType: 'release_published',
        subject: '🚀 New Release: {{tag}}',
        body: 'Version {{tag}} was released on {{repository}}.\n\n{{changelog}}',
        channels: ['email', 'slack', 'discord', 'in-app'],
      },
      {
        eventType: 'contributor_joined',
        subject: 'New Contributor: {{username}}',
        body: '{{username}} just made their first contribution to {{repository}}! 🎉',
        channels: ['in-app'],
      },
    ];

    defaultTemplates.forEach((t) => this.templates.set(t.eventType, t));
  }

  createPreferences(userId: string): NotificationPreferences {
    const preferences: NotificationPreferences = {
      userId,
      events: new Map(),
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      batchSettings: {
        enabled: false,
        frequency: 'immediate',
      },
      globalEnabled: true,
    };

    // Add default event preferences
    const defaultEvents = [
      { type: 'new_issue', enabled: true, channels: ['email', 'in-app'] as NotificationChannel[], priority: 'normal' as NotificationPriority },
      { type: 'new_pr', enabled: true, channels: ['email', 'slack'] as NotificationChannel[], priority: 'high' as NotificationPriority },
      { type: 'pr_merged', enabled: true, channels: ['in-app'] as NotificationChannel[], priority: 'low' as NotificationPriority },
      { type: 'security_alert', enabled: true, channels: ['email', 'slack', 'discord'] as NotificationChannel[], priority: 'urgent' as NotificationPriority },
      { type: 'release_published', enabled: true, channels: ['email', 'slack'] as NotificationChannel[], priority: 'normal' as NotificationPriority },
      { type: 'contributor_joined', enabled: true, channels: ['in-app'] as NotificationChannel[], priority: 'low' as NotificationPriority },
      { type: 'weekly_report', enabled: true, channels: ['email'] as NotificationChannel[], priority: 'normal' as NotificationPriority },
    ];

    defaultEvents.forEach((event) => {
      preferences.events.set(event.type, {
        type: event.type,
        enabled: event.enabled,
        channels: event.channels,
        priority: event.priority,
      });
    });

    this.preferences.set(userId, preferences);
    return preferences;
  }

  getPreferences(userId: string): NotificationPreferences | undefined {
    return this.preferences.get(userId);
  }

  updateEventPreference(userId: string, eventType: string, updates: Partial<NotificationEvent>): boolean {
    const prefs = this.preferences.get(userId);
    if (!prefs) return false;

    const event = prefs.events.get(eventType);
    if (!event) return false;

    prefs.events.set(eventType, { ...event, ...updates });
    return true;
  }

  setQuietHours(userId: string, quietHours: NotificationPreferences['quietHours']): boolean {
    const prefs = this.preferences.get(userId);
    if (!prefs) return false;
    prefs.quietHours = quietHours;
    return true;
  }

  shouldNotify(userId: string, eventType: string): { shouldNotify: boolean; reason?: string } {
    const prefs = this.preferences.get(userId);
    if (!prefs) return { shouldNotify: true };

    if (!prefs.globalEnabled) return { shouldNotify: false, reason: 'Notifications globally disabled' };

    const event = prefs.events.get(eventType);
    if (!event?.enabled) return { shouldNotify: false, reason: `Event ${eventType} is disabled` };

    if (prefs.quietHours.enabled) {
      const now = new Date();
      const timeZone = prefs.quietHours.timezone;
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
      });
      const currentTime = formatter.format(now);
      
      if (currentTime >= prefs.quietHours.start || currentTime <= prefs.quietHours.end) {
        return { shouldNotify: false, reason: 'Currently in quiet hours' };
      }
    }

    return { shouldNotify: true };
  }

  getTemplate(eventType: string): NotificationTemplate | undefined {
    return this.templates.get(eventType);
  }

  renderTemplate(template: NotificationTemplate, variables: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { subject, body };
  }

  exportPreferences(userId: string): string {
    const prefs = this.preferences.get(userId);
    if (!prefs) return '{}';

    return JSON.stringify({
      ...prefs,
      events: Array.from(prefs.events.entries()),
    }, null, 2);
  }

  importPreferences(data: string): NotificationPreferences | null {
    try {
      const parsed = JSON.parse(data);
      const prefs: NotificationPreferences = {
        ...parsed,
        events: new Map(parsed.events || []),
      };
      this.preferences.set(prefs.authorId, prefs);
      return prefs;
    } catch {
      return null;
    }
  }
}

export const notificationManager = new NotificationPreferencesManager();

export function createNotificationManager(): NotificationPreferencesManager {
  return new NotificationPreferencesManager();
}

export { NotificationPreferencesManager };
