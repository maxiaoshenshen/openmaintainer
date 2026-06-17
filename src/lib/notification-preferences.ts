/**
 * Notification Preferences - Fine-grained notification control
 */

export type NotificationChannel = "email" | "slack" | "discord" | "webhook" | "in_app";
export type NotificationFrequency = "realtime" | "hourly" | "daily" | "weekly";

export interface NotificationRule {
  id: string;
  event: string;
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
  filters?: {
    authors?: string[];
    labels?: string[];
    excludeLabels?: string[];
  };
  enabled: boolean;
}

export interface NotificationPreferences {
  userId: string;
  rules: NotificationRule[];
  globalSettings: {
    emailDigest: boolean;
    slackNotifications: boolean;
    mentionOnly: boolean;
    quietHours?: {
      start: string; // HH:mm
      end: string;
      timezone: string;
    };
  };
}

/**
 * Create default notification preferences
 */
export function createDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    rules: [
      {
        id: "rule_mentions",
        event: "issue.mentioned",
        channels: ["email", "in_app"],
        frequency: "realtime",
        enabled: true,
      },
      {
        id: "rule_pr_review",
        event: "pr.review_requested",
        channels: ["email", "slack"],
        frequency: "realtime",
        enabled: true,
      },
      {
        id: "rule_merged",
        event: "pr.merged",
        channels: ["in_app"],
        frequency: "daily",
        enabled: true,
      },
    ],
    globalSettings: {
      emailDigest: true,
      slackNotifications: true,
      mentionOnly: false,
    },
  };
}

/**
 * Add notification rule
 */
export function addRule(
  prefs: NotificationPreferences,
  rule: Omit<NotificationRule, "id">
): NotificationPreferences {
  const newRule: NotificationRule = {
    ...rule,
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  return {
    ...prefs,
    rules: [...prefs.rules, newRule],
  };
}

/**
 * Update notification rule
 */
export function updateRule(
  prefs: NotificationPreferences,
  ruleId: string,
  updates: Partial<NotificationRule>
): NotificationPreferences {
  return {
    ...prefs,
    rules: prefs.rules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ),
  };
}

/**
 * Remove notification rule
 */
export function removeRule(
  prefs: NotificationPreferences,
  ruleId: string
): NotificationPreferences {
  return {
    ...prefs,
    rules: prefs.rules.filter(rule => rule.id !== ruleId),
  };
}

/**
 * Check if notification should be sent
 */
export function shouldNotify(
  prefs: NotificationPreferences,
  event: string,
  context: { author?: string; labels?: string[] }
): { shouldSend: boolean; channels: NotificationChannel[] } {
  const now = new Date();
  const { quietHours } = prefs.globalSettings;

  // Check quiet hours
  if (quietHours) {
    const currentTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: quietHours.timezone,
    });
    if (currentTime >= quietHours.start && currentTime <= quietHours.end) {
      return { shouldSend: false, channels: [] };
    }
  }

  // Check mention-only mode
  if (prefs.globalSettings.mentionOnly && !context.author?.includes("@")) {
    return { shouldSend: false, channels: [] };
  }

  // Find matching rules
  const matchingRules = prefs.rules.filter(rule => {
    if (!rule.enabled) return false;
    if (rule.event !== event && rule.event !== "*") return false;

    // Check filters
    if (rule.filters) {
      if (rule.filters.authors?.length && !rule.filters.authors.includes(context.author || "")) {
        return false;
      }
      if (rule.filters.labels?.length) {
        const hasLabel = rule.filters.labels.some(l => context.labels?.includes(l));
        if (!hasLabel) return false;
      }
      if (rule.filters.excludeLabels?.length) {
        const hasExclude = rule.filters.excludeLabels.some(l => context.labels?.includes(l));
        if (hasExclude) return false;
      }
    }
    return true;
  });

  if (matchingRules.length === 0) {
    return { shouldSend: false, channels: [] };
  }

  // Collect unique channels
  const channels = [...new Set(matchingRules.flatMap(r => r.channels))];
  return { shouldSend: true, channels };
}

/**
 * Group notifications by frequency
 */
export function groupByFrequency(
  notifications: { event: string; rule: NotificationRule }[]
): Record<NotificationFrequency, typeof notifications> {
  return notifications.reduce((acc, notification) => {
    const freq = notification.rule.frequency;
    if (!acc[freq]) acc[freq] = [];
    acc[freq].push(notification);
    return acc;
  }, {} as Record<NotificationFrequency, typeof notifications>);
}
