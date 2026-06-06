import { describe, it, expect } from 'vitest';
import { createNotificationManager } from './notification-preferences';

describe('NotificationPreferencesManager', () => {
  it('creates notification manager instance', () => {
    const manager = createNotificationManager();
    expect(manager).toBeDefined();
  });

  it('creates default preferences', () => {
    const manager = createNotificationManager();
    const prefs = manager.createPreferences('user123');
    expect(prefs.userId).toBe('user123');
    expect(prefs.globalEnabled).toBe(true);
    expect(prefs.events.size).toBeGreaterThan(0);
  });

  it('gets preferences', () => {
    const manager = createNotificationManager();
    manager.createPreferences('user456');
    const prefs = manager.getPreferences('user456');
    expect(prefs).toBeDefined();
    expect(prefs?.userId).toBe('user456');
  });

  it('gets notification template', () => {
    const manager = createNotificationManager();
    const template = manager.getTemplate('new_issue');
    expect(template).toBeDefined();
    expect(template?.eventType).toBe('new_issue');
  });

  it('renders template with variables', () => {
    const manager = createNotificationManager();
    const template = manager.getTemplate('new_issue');
    expect(template).toBeDefined();
    
    const rendered = manager.renderTemplate(template!, {
      title: 'Bug Report',
      author: 'testuser',
      repository: 'test/repo',
      priority: 'high',
      labels: 'bug',
    });
    
    expect(rendered.subject).toContain('Bug Report');
    expect(rendered.body).toContain('Bug Report');
    expect(rendered.body).toContain('testuser');
  });

  it('updates event preference', () => {
    const manager = createNotificationManager();
    manager.createPreferences('user789');
    const updated = manager.updateEventPreference('user789', 'new_issue', {
      enabled: false,
    });
    expect(updated).toBe(true);
  });

  it('exports and imports preferences', () => {
    const manager = createNotificationManager();
    manager.createPreferences('user_export');
    const exported = manager.exportPreferences('user_export');
    expect(exported).toBeDefined();
    expect(exported).toContain('user_export');
    
    const imported = manager.importPreferences(exported);
    expect(imported).toBeDefined();
    expect(imported?.userId).toBe('user_export');
  });
});
