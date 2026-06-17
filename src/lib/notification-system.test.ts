import { describe, it, expect, beforeEach } from "vitest";
import { notificationManager, NotificationManager } from "./notification-system";

describe("NotificationManager", () => {
  let manager: NotificationManager;

  beforeEach(() => {
    manager = new NotificationManager();
  });

  describe("notify", () => {
    it("should create a notification", () => {
      const notification = manager.notify("info", "Test Title", "Test message");
      expect(notification).not.toBeNull();
      expect(notification?.title).toBe("Test Title");
      expect(notification?.message).toBe("Test message");
      expect(notification?.type).toBe("info");
    });

    it("should return null for disabled channel", () => {
      manager.setPreferences("email", { channel: "email", enabled: false, types: ["info"] });
      const notification = manager.notify("info", "Test", "Test", "email");
      expect(notification).toBeNull();
    });

    it("should return null for disabled type", () => {
      manager.setPreferences("in_app", { channel: "in_app", enabled: true, types: ["success"] });
      const notification = manager.notify("info", "Test", "Test", "in_app");
      expect(notification).toBeNull();
    });

    it("should include metadata", () => {
      const metadata = { repo: "test/repo", issue: 123 };
      const notification = manager.notify("info", "Test", "Test", "in_app", metadata);
      expect(notification?.metadata).toEqual(metadata);
    });
  });

  describe("getNotifications", () => {
    it("should return all notifications by default", () => {
      manager.notify("info", "1", "");
      manager.notify("success", "2", "");
      const notifications = manager.getNotifications();
      expect(notifications.length).toBe(2);
    });

    it("should filter by channel", () => {
      manager.setPreferences("email", { channel: "email", enabled: true, types: ["info", "success", "warning", "error"] });
      manager.notify("info", "1", "", "in_app");
      manager.notify("info", "2", "", "email");
      const notifications = manager.getNotifications({ channel: "email" });
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe("2");
    });

    it("should filter by type", () => {
      manager.notify("info", "1", "");
      manager.notify("error", "2", "");
      const notifications = manager.getNotifications({ type: "error" });
      expect(notifications.length).toBe(1);
    });

    it("should filter unread only", () => {
      manager.notify("info", "1", "");
      manager.notify("info", "2", "");
      manager.markAsRead(manager.getNotifications()[1].id);
      const unread = manager.getNotifications({ unreadOnly: true });
      expect(unread.length).toBe(1);
    });

    it("should limit results", () => {
      for (let i = 0; i < 10; i++) {
        manager.notify("info", String(i), "");
      }
      const notifications = manager.getNotifications({ limit: 5 });
      expect(notifications.length).toBe(5);
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", () => {
      const notification = manager.notify("info", "Test", "");
      if (notification) {
        expect(notification.read).toBe(false);
        manager.markAsRead(notification.id);
        const updated = manager.getNotifications()[0];
        expect(updated.read).toBe(true);
      }
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", () => {
      manager.notify("info", "1", "");
      manager.notify("info", "2", "");
      manager.markAllAsRead();
      const notifications = manager.getNotifications();
      expect(notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe("deleteNotification", () => {
    it("should delete a notification", () => {
      const notification = manager.notify("info", "Test", "");
      if (notification) {
        manager.deleteNotification(notification.id);
        expect(manager.getNotifications().length).toBe(0);
      }
    });
  });

  describe("getUnreadCount", () => {
    it("should return correct unread count", () => {
      manager.notify("info", "1", "");
      manager.notify("info", "2", "");
      expect(manager.getUnreadCount()).toBe(2);
      manager.markAllAsRead();
      expect(manager.getUnreadCount()).toBe(0);
    });
  });

  describe("preferences", () => {
    it("should get and set preferences", () => {
      manager.setPreferences("slack", {
        channel: "slack",
        enabled: true,
        types: ["error"],
        minSeverity: "error",
      });
      const prefs = manager.getPreferences("slack");
      expect(prefs?.enabled).toBe(true);
      expect(prefs?.types).toContain("error");
    });

    it("should return all preferences", () => {
      const allPrefs = manager.getAllPreferences();
      expect(allPrefs.length).toBe(4); // in_app, email, webhook, slack
    });
  });

  describe("subscribe", () => {
    it("should call listener on new notification", () => {
      let called = false;
      manager.subscribe(() => {
        called = true;
      });
      manager.notify("info", "Test", "");
      expect(called).toBe(true);
    });

    it("should return unsubscribe function", () => {
      let count = 0;
      const unsubscribe = manager.subscribe(() => {
        count++;
      });
      unsubscribe();
      manager.notify("info", "Test", "");
      expect(count).toBe(0);
    });
  });

  describe("helper methods", () => {
    it("notifySuccess should create success notification", () => {
      const notification = manager.notifySuccess("Success!", "Done");
      expect(notification?.type).toBe("success");
    });

    it("notifyError should create error notification", () => {
      const notification = manager.notifyError("Error!", "Failed");
      expect(notification?.type).toBe("error");
    });

    it("notifyNewIssue should include issue metadata", () => {
      const notification = manager.notifyNewIssue("test/repo", 123, "Bug fix");
      expect(notification?.metadata?.type).toBe("issue");
      expect(notification?.metadata?.issueNumber).toBe(123);
    });

    it("notifyPRMerged should include pr metadata", () => {
      const notification = manager.notifyPRMerged("test/repo", 456, "Feature");
      expect(notification?.metadata?.type).toBe("pr_merged");
      expect(notification?.type).toBe("success");
    });
  });
});

describe("global notificationManager", () => {
  beforeEach(() => {
    notificationManager.clearAll();
  });

  it("should be instance of NotificationManager", () => {
    expect(notificationManager).toBeInstanceOf(NotificationManager);
  });

  it("should have default preferences", () => {
    const prefs = notificationManager.getAllPreferences();
    expect(prefs.length).toBeGreaterThan(0);
  });
});
