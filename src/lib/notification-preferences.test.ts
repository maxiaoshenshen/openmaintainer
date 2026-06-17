import { describe, it, expect } from "vitest";
import {
  createDefaultPreferences,
  addRule,
  updateRule,
  removeRule,
  shouldNotify,
  groupByFrequency,
  type NotificationPreferences,
} from "./notification-preferences";

describe("Notification Preferences", () => {
  describe("createDefaultPreferences", () => {
    it("should create preferences with default rules", () => {
      const prefs = createDefaultPreferences("user123");

      expect(prefs.userId).toBe("user123");
      expect(prefs.rules.length).toBeGreaterThan(0);
      expect(prefs.globalSettings.emailDigest).toBe(true);
    });
  });

  describe("addRule", () => {
    it("should add new rule with unique ID", () => {
      const prefs = createDefaultPreferences("user123");
      const newPrefs = addRule(prefs, {
        event: "release.published",
        channels: ["slack"],
        frequency: "realtime",
        enabled: true,
      });

      expect(newPrefs.rules.length).toBe(prefs.rules.length + 1);
      expect(newPrefs.rules[newPrefs.rules.length - 1].event).toBe("release.published");
    });
  });

  describe("updateRule", () => {
    it("should update existing rule", () => {
      const prefs = createDefaultPreferences("user123");
      const ruleId = prefs.rules[0].id;
      const newPrefs = updateRule(prefs, ruleId, { enabled: false });

      expect(newPrefs.rules.find(r => r.id === ruleId)?.enabled).toBe(false);
    });

    it("should not modify other rules", () => {
      const prefs = createDefaultPreferences("user123");
      const ruleId = prefs.rules[0].id;
      const otherRule = prefs.rules[1];
      const newPrefs = updateRule(prefs, ruleId, { enabled: false });

      expect(newPrefs.rules.find(r => r.id === otherRule.id)).toEqual(otherRule);
    });
  });

  describe("removeRule", () => {
    it("should remove rule by ID", () => {
      const prefs = createDefaultPreferences("user123");
      const ruleId = prefs.rules[0].id;
      const newPrefs = removeRule(prefs, ruleId);

      expect(newPrefs.rules.find(r => r.id === ruleId)).toBeUndefined();
    });
  });

  describe("shouldNotify", () => {
    it("should return true for matching event", () => {
      const prefs = createDefaultPreferences("user123");
      const result = shouldNotify(prefs, "issue.mentioned", { author: "alice" });

      expect(result.shouldSend).toBe(true);
      expect(result.channels.length).toBeGreaterThan(0);
    });

    it("should filter by labels", () => {
      const prefs: NotificationPreferences = {
        userId: "test",
        rules: [{
          id: "label_test",
          event: "issue.mentioned",
          channels: ["email"],
          frequency: "realtime",
          enabled: true,
          filters: { labels: ["bug"] }
        }],
        globalSettings: { emailDigest: false, slackNotifications: false, mentionOnly: false }
      };
      
      const result = shouldNotify(prefs, "issue.mentioned", { 
        author: "alice", 
        labels: ["bug", "urgent"] 
      });

      expect(result.shouldSend).toBe(true);
    });

    it("should exclude labels", () => {
      const prefs: NotificationPreferences = {
        userId: "test",
        rules: [{
          id: "exclude_test",
          event: "issue.mentioned",
          channels: ["email"],
          frequency: "realtime",
          enabled: true,
          filters: { excludeLabels: ["wip"] }
        }],
        globalSettings: { emailDigest: false, slackNotifications: false, mentionOnly: false }
      };
      
      const result = shouldNotify(prefs, "issue.mentioned", { 
        author: "alice", 
        labels: ["wip"] 
      });

      expect(result.shouldSend).toBe(false);
    });

    it("should return channels when notification matches", () => {
      const prefs = createDefaultPreferences("user123");
      const result = shouldNotify(prefs, "pr.review_requested", { author: "alice" });

      expect(result.shouldSend).toBe(true);
      expect(result.channels).toContain("email");
      expect(result.channels).toContain("slack");
    });

    it("should return false for non-matching event", () => {
      const prefs = createDefaultPreferences("user123");
      const result = shouldNotify(prefs, "release.published", { author: "alice" });

      expect(result.shouldSend).toBe(false);
    });
  });

  describe("groupByFrequency", () => {
    it("should group notifications by frequency", () => {
      const notifications = [
        { event: "test1", rule: { id: "1", event: "test1", channels: ["email"], frequency: "realtime", enabled: true } },
        { event: "test2", rule: { id: "2", event: "test2", channels: ["slack"], frequency: "daily", enabled: true } },
      ];

      const grouped = groupByFrequency(notifications);

      expect(grouped.realtime).toHaveLength(1);
      expect(grouped.daily).toHaveLength(1);
    });
  });
});
