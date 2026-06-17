/**
 * Email Notification Service - Send notifications to maintainers
 */

export interface EmailRecipient {
  email: string;
  name?: string;
  role?: 'to' | 'cc' | 'bcc';
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailMessage {
  id: string;
  recipients: EmailRecipient[];
  subject: string;
  body: string;
  html?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, unknown>;
  status: 'queued' | 'sent' | 'failed' | 'bounced';
  sentAt?: Date;
  error?: string;
}

export interface NotificationPreferences {
  email: string;
  enabled: boolean;
  types: {
    issues: boolean;
    pullRequests: boolean;
    releases: boolean;
    securityAlerts: boolean;
    weeklyDigest: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours?: { start: string; end: string; timezone: string };
}

export class EmailNotifier {
  private templates: Map<string, EmailTemplate> = new Map();
  private queue: EmailMessage[] = [];
  private sentMessages: EmailMessage[] = [];
  private preferences: Map<string, NotificationPreferences> = new Map();

  constructor(private fromEmail: string, private fromName = 'OpenMaintainer') {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.registerTemplate({
      id: 'pr merged',
      name: 'Pull Request Merged',
      subject: 'PR Merged: {{prTitle}}',
      body: 'Your pull request "{{prTitle}}" has been merged into {{branch}}.',
      variables: ['prTitle', 'branch', 'mergedBy']
    });

    this.registerTemplate({
      id: 'new release',
      name: 'New Release',
      subject: 'New Release: {{version}}',
      body: 'Version {{version}} has been released.',
      variables: ['version', 'releaseNotes', 'author']
    });

    this.registerTemplate({
      id: 'security alert',
      name: 'Security Alert',
      subject: '[Security] {{title}}',
      body: 'A security vulnerability has been detected: {{title}}',
      variables: ['title', 'severity', 'description']
    });
  }

  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  renderTemplate(templateId: string, variables: Record<string, string>): { subject: string; body: string } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const render = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);

    return {
      subject: render(template.subject),
      body: render(template.body)
    };
  }

  queueEmail(
    recipients: EmailRecipient[],
    subject: string,
    body: string,
    options?: {
      html?: string;
      attachments?: EmailAttachment[];
      metadata?: Record<string, unknown>;
    }
  ): EmailMessage {
    const message: EmailMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipients,
      subject,
      body,
      html: options?.html,
      attachments: options?.attachments,
      metadata: options?.metadata,
      status: 'queued'
    };

    this.queue.push(message);
    return message;
  }

  async sendEmail(message: EmailMessage): Promise<boolean> {
    // Simulate sending - in production this would use SMTP/SendGrid/etc
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      message.status = 'sent';
      message.sentAt = new Date();
      this.sentMessages.push(message);
      return true;
    } catch (error) {
      message.status = 'failed';
      message.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  async processQueue(batchSize = 10): Promise<{ sent: number; failed: number }> {
    const batch = this.queue.splice(0, batchSize);
    let sent = 0;
    let failed = 0;

    for (const message of batch) {
      const success = await this.sendEmail(message);
      if (success) sent++;
      else failed++;
    }

    return { sent, failed };
  }

  getQueueStatus(): { queued: number; sent: number; failed: number } {
    return {
      queued: this.queue.length,
      sent: this.sentMessages.filter(m => m.status === 'sent').length,
      failed: this.sentMessages.filter(m => m.status === 'failed').length
    };
  }

  setPreferences(email: string, prefs: Partial<NotificationPreferences>): void {
    const existing = this.preferences.get(email) || {
      email,
      enabled: true,
      types: {
        issues: true,
        pullRequests: true,
        releases: true,
        securityAlerts: true,
        weeklyDigest: true
      },
      frequency: 'immediate' as const
    };

    this.preferences.set(email, { ...existing, ...prefs });
  }

  getPreferences(email: string): NotificationPreferences | undefined {
    return this.preferences.get(email);
  }

  shouldNotify(email: string, notificationType: keyof NotificationPreferences['types']): boolean {
    const prefs = this.preferences.get(email);
    if (!prefs || !prefs.enabled) return false;
    return prefs.types[notificationType] ?? false;
  }

  isInQuietHours(email: string): boolean {
    const prefs = this.preferences.get(email);
    if (!prefs?.quietHours) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end;
  }

  getSentMessages(limit = 50): EmailMessage[] {
    return this.sentMessages.slice(-limit);
  }

  getMessageById(id: string): EmailMessage | undefined {
    return this.sentMessages.find(m => m.id === id) ||
           this.queue.find(m => m.id === id);
  }
}
