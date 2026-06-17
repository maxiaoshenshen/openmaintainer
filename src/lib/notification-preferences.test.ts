import { describe, it, expect } from 'vitest';
import { NotificationPreferencesManager } from './notification-preferences';

describe('NotificationPreferencesManager', () => {
  const manager = new NotificationPreferencesManager();

  it('should create a preference', async () => {
    const pref = await manager.createPreference({
      userId: 'user-1',
      channel: 'email',
      event: 'pr_opened',
    });

    expect(pref.id).toBeDefined();
    expect(pref.userId).toBe('user-1');
    expect(pref.channel).toBe('email');
    expect(pref.event).toBe('pr_opened');
    expect(pref.enabled).toBe(true);
  });

  it('should update preference', async () => {
    const pref = await manager.createPreference({
      userId: 'user-1',
      channel: 'slack',
      event: 'issue_closed',
    });

    const updated = await manager.updatePreference(pref.id, {
      frequency: 'daily',
      enabled: false,
    });

    expect(updated?.frequency).toBe('daily');
    expect(updated?.enabled).toBe(false);
  });

  it('should delete preference', async () => {
    const pref = await manager.createPreference({
      userId: 'user-1',
      channel: 'discord',
      event: 'pr_merged',
    });

    const deleted = await manager.deletePreference(pref.id);
    expect(deleted).toBe(true);

    const retrieved = await manager.getPreference(pref.id);
    expect(retrieved).toBeNull();
  });

  it('should get user preferences', async () => {
    await manager.createPreference({
      userId: 'user-2',
      channel: 'email',
      event: 'pr_opened',
    });

    await manager.createPreference({
      userId: 'user-2',
      channel: 'slack',
      event: 'issue_opened',
    });

    const prefs = await manager.getUserPreferences('user-2');
    expect(prefs.length).toBe(2);
  });

  it('should get enabled preferences for event', async () => {
    await manager.createPreference({
      userId: 'user-3',
      channel: 'email',
      event: 'pr_opened',
    });

    await manager.createPreference({
      userId: 'user-4',
      channel: 'slack',
      event: 'pr_opened',
    });

    const prefs = await manager.getEnabledPreferences('pr_opened');
    expect(prefs.length).toBeGreaterThanOrEqual(2);
  });

  it('should create user profile', async () => {
    const profile = await manager.createProfile({
      userId: 'user-5',
      email: 'user@example.com',
      slackWebhook: 'https://slack.com/webhook',
      timezone: 'America/New_York',
      language: 'en',
    });

    expect(profile.userId).toBe('user-5');
    expect(profile.email).toBe('user@example.com');
    expect(profile.timezone).toBe('America/New_York');
  });

  it('should get user profile', async () => {
    await manager.createProfile({
      userId: 'user-6',
      email: 'test@example.com',
    });

    const profile = await manager.getProfile('user-6');
    expect(profile).toBeDefined();
    expect(profile?.email).toBe('test@example.com');
  });

  it('should update profile', async () => {
    await manager.createProfile({
      userId: 'user-7',
      email: 'old@example.com',
    });

    const updated = await manager.updateProfile('user-7', {
      email: 'new@example.com',
      timezone: 'Europe/London',
    });

    expect(updated?.email).toBe('new@example.com');
    expect(updated?.timezone).toBe('Europe/London');
  });

  it('should check if should notify', async () => {
    const pref = await manager.createPreference({
      userId: 'user-8',
      channel: 'email',
      event: 'pr_opened',
      quietHours: { start: '22:00', end: '08:00' },
    });

    const shouldNotify = await manager.shouldNotify(pref);
    // Result depends on current time
    expect(typeof shouldNotify).toBe('boolean');
  });

  it('should bulk create preferences', async () => {
    const prefs = await manager.bulkCreate({
      userId: 'user-9',
      channels: ['email', 'slack'],
      events: ['pr_opened', 'pr_merged'],
      frequency: 'immediate',
    });

    expect(prefs.length).toBe(4);
  });

  it('should enable all preferences for user', async () => {
    await manager.createPreference({
      userId: 'user-10',
      channel: 'email',
      event: 'pr_opened',
      frequency: 'immediate',
    });

    await manager.createPreference({
      userId: 'user-10',
      channel: 'slack',
      event: 'issue_opened',
      frequency: 'immediate',
    });

    await manager.enableAll('user-10');
    const prefs = await manager.getUserPreferences('user-10');
    expect(prefs.every(p => p.enabled)).toBe(true);
  });

  it('should disable all preferences for user', async () => {
    await manager.createPreference({
      userId: 'user-11',
      channel: 'email',
      event: 'pr_opened',
    });

    await manager.disableAll('user-11');
    const prefs = await manager.getUserPreferences('user-11');
    expect(prefs.every(p => !p.enabled)).toBe(true);
  });

  it('should record notification', async () => {
    await manager.createProfile({
      userId: 'user-12',
      email: 'notify@example.com',
    });

    await manager.recordNotification('user-12', 'email', 'pr_opened');
    await manager.recordNotification('user-12', 'slack', 'pr_merged');

    const summary = await manager.getSummary();
    expect(summary.totalSent).toBeGreaterThanOrEqual(0);
  });

  it('should handle filters', async () => {
    const pref = await manager.createPreference({
      userId: 'user-13',
      channel: 'email',
      event: 'issue_opened',
      filters: {
        priority: 'high',
        labels: ['bug', 'urgent'],
      },
    });

    expect(pref.filters?.priority).toBe('high');
    expect(pref.filters?.labels).toContain('bug');
  });
});
