import { describe, it, expect, beforeEach } from 'vitest';
import { EmailNotifier } from './email-notifier';

describe('EmailNotifier', () => {
  let notifier: EmailNotifier;

  beforeEach(() => {
    notifier = new EmailNotifier('noreply@openmaintainer.dev', 'OpenMaintainer');
  });

  describe('registerTemplate', () => {
    it('should register a custom template', () => {
      const template = {
        id: 'custom',
        name: 'Custom Template',
        subject: 'Custom: {{name}}',
        body: 'Hello {{name}}',
        variables: ['name']
      };
      notifier.registerTemplate(template);
      expect(notifier.getTemplate('custom')).toBeDefined();
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', () => {
      const result = notifier.renderTemplate('pr merged', {
        prTitle: 'Fix bug',
        branch: 'main'
      });
      expect(result?.subject).toBe('PR Merged: Fix bug');
      expect(result?.body).toContain('Fix bug');
    });

    it('should return null for non-existent template', () => {
      expect(notifier.renderTemplate('non-existent', {})).toBeNull();
    });
  });

  describe('queueEmail', () => {
    it('should queue an email', () => {
      const msg = notifier.queueEmail(
        [{ email: 'user@example.com', role: 'to' }],
        'Test Subject',
        'Test body'
      );
      expect(msg.status).toBe('queued');
      expect(msg.id).toBeDefined();
    });

    it('should queue with attachments', () => {
      const msg = notifier.queueEmail(
        [{ email: 'user@example.com' }],
        'With Attachment',
        'Body',
        {
          attachments: [{ filename: 'file.txt', content: 'content' }]
        }
      );
      expect(msg.attachments).toHaveLength(1);
    });
  });

  describe('sendEmail', () => {
    it('should send queued email', async () => {
      const msg = notifier.queueEmail(
        [{ email: 'user@example.com' }],
        'Send Test',
        'Body'
      );
      const result = await notifier.sendEmail(msg);
      expect(result).toBe(true);
      expect(msg.status).toBe('sent');
      expect(msg.sentAt).toBeDefined();
    });
  });

  describe('processQueue', () => {
    it('should process queued emails', async () => {
      notifier.queueEmail([{ email: 'a@test.com' }], 'A', 'Body');
      notifier.queueEmail([{ email: 'b@test.com' }], 'B', 'Body');
      const result = await notifier.processQueue();
      expect(result.sent).toBe(2);
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', () => {
      notifier.queueEmail([{ email: 'test@test.com' }], 'T', 'B');
      const status = notifier.getQueueStatus();
      expect(status.queued).toBe(1);
    });
  });

  describe('setPreferences', () => {
    it('should set notification preferences', () => {
      notifier.setPreferences('user@test.com', {
        types: { issues: false, pullRequests: true, releases: true, securityAlerts: true, weeklyDigest: false },
        frequency: 'daily'
      });
      const prefs = notifier.getPreferences('user@test.com');
      expect(prefs?.frequency).toBe('daily');
      expect(prefs?.types.issues).toBe(false);
    });
  });

  describe('shouldNotify', () => {
    it('should respect notification preferences', () => {
      notifier.setPreferences('user@test.com', {
        types: { issues: false, pullRequests: true, releases: true, securityAlerts: true, weeklyDigest: true },
        frequency: 'immediate'
      });
      expect(notifier.shouldNotify('user@test.com', 'issues')).toBe(false);
      expect(notifier.shouldNotify('user@test.com', 'pullRequests')).toBe(true);
    });

    it('should return false for disabled email', () => {
      notifier.setPreferences('disabled@test.com', { enabled: false, types: { issues: true, pullRequests: true, releases: true, securityAlerts: true, weeklyDigest: true }, frequency: 'immediate' });
      expect(notifier.shouldNotify('disabled@test.com', 'issues')).toBe(false);
    });
  });

  describe('getSentMessages', () => {
    it('should return sent messages', async () => {
      notifier.queueEmail([{ email: 'test@test.com' }], 'T', 'B');
      await notifier.processQueue();
      const messages = notifier.getSentMessages();
      expect(messages.length).toBeGreaterThan(0);
    });
  });
});
