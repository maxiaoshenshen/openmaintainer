import { describe, it, expect, beforeEach } from "vitest";
import { EventProcessor } from "./event-processor";
import { NotificationManager } from "./notification-system";
import type { WebhookPayload } from "./webhook-handler";

describe("EventProcessor", () => {
  let processor: EventProcessor;
  let notificationManager: NotificationManager;

  beforeEach(() => {
    notificationManager = new NotificationManager();
    processor = new EventProcessor(notificationManager);
  });

  describe("processWebhook", () => {
    it("should process PR opened event", async () => {
      const payload: WebhookPayload = {
        action: "opened",
        pull_request: {
          number: 123,
          title: "Add new feature",
          merged: false,
          user: { login: "contributor" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "contributor" },
      };

      const events = await processor.processWebhook(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("pr_opened");
      expect(events[0].repository).toBe("owner/repo");
      expect(events[0].actor).toBe("contributor");
    });

    it("should process PR merged event", async () => {
      const payload: WebhookPayload = {
        action: "closed",
        pull_request: {
          number: 456,
          title: "Merge feature",
          merged: true,
          user: { login: "developer" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "developer" },
      };

      const events = await processor.processWebhook(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("pr_merged");
      expect(events[0].severity).toBe("success");
    });

    it("should process issue opened event", async () => {
      const payload: WebhookPayload = {
        action: "opened",
        issue: {
          number: 789,
          title: "Bug report",
          user: { login: "reporter" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "reporter" },
      };

      const events = await processor.processWebhook(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("issue_opened");
      expect(events[0].actionRequired).toBe(true);
    });

    it("should process release published event", async () => {
      const payload: WebhookPayload = {
        action: "published",
        release: {
          tag_name: "v1.0.0",
          name: "First Release",
          body: "Initial release",
          prerelease: false,
          draft: false,
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "maintainer" },
      };

      const events = await processor.processWebhook(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("release_published");
      expect(events[0].severity).toBe("success");
    });
  });

  describe("custom rules", () => {
    it("should execute custom rule action", async () => {
      const payload: WebhookPayload = {
        action: "opened",
        pull_request: {
          number: 100,
          title: "Test PR",
          merged: false,
          user: { login: "contributor" },
          labels: [{ name: "wip" }],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "contributor" },
      };

      processor.addRule({
        eventTypes: ["pr_opened"],
        action: "notify",
        channel: "in_app",
      });

      await processor.processWebhook(payload);

      const notifications = notificationManager.getNotifications();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it("should support conditional rules", async () => {
      const payload: WebhookPayload = {
        action: "opened",
        pull_request: {
          number: 200,
          title: "WIP PR",
          merged: false,
          user: { login: "contributor" },
          labels: [{ name: "wip" }],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "contributor" },
      };

      // Only notify for PRs with "urgent" label
      processor.addRule({
        eventTypes: ["pr_opened"],
        condition: (e) => e.metadata?.labels?.includes("urgent"),
        action: "notify",
        channel: "in_app",
      });

      await processor.processWebhook(payload);

      const notifications = notificationManager.getNotifications();
      expect(notifications.length).toBe(0); // No urgent label, no notification
    });
  });

  describe("listeners", () => {
    it("should call registered listener", async () => {
      let called = false;
      processor.on("pr_opened", () => {
        called = true;
      });

      const payload: WebhookPayload = {
        action: "opened",
        pull_request: {
          number: 300,
          title: "Test",
          merged: false,
          user: { login: "user" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "user" },
      };

      await processor.processWebhook(payload);

      expect(called).toBe(true);
    });

    it("should remove listener", () => {
      let count = 0;
      const handler = () => count++;

      processor.on("pr_opened", handler);
      processor.off("pr_opened", handler);

      // Manually add event to history
      (processor as any).eventHistory.push({
        id: "test",
        type: "pr_opened",
        repository: "owner/repo",
        actor: "user",
        timestamp: Date.now(),
        severity: "info",
        title: "Test",
        description: "Test",
        actionRequired: false,
      });

      (processor as any).handleEvent({
        id: "test2",
        type: "pr_opened",
        repository: "owner/repo",
        actor: "user",
        timestamp: Date.now(),
        severity: "info",
        title: "Test",
        description: "Test",
        actionRequired: false,
      });

      expect(count).toBe(0);
    });
  });

  describe("getEventHistory", () => {
    it("should return event history", async () => {
      const payload: WebhookPayload = {
        action: "opened",
        pull_request: {
          number: 400,
          title: "Test",
          merged: false,
          user: { login: "user" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "user" },
      };

      await processor.processWebhook(payload);

      const history = processor.getEventHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it("should filter by type", async () => {
      const payload1: WebhookPayload = {
        action: "opened",
        pull_request: {
          number: 500,
          title: "PR",
          merged: false,
          user: { login: "user" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "user" },
      };

      const payload2: WebhookPayload = {
        action: "opened",
        issue: {
          number: 501,
          title: "Issue",
          user: { login: "user" },
          labels: [],
        },
        repository: { full_name: "owner/repo" },
        sender: { login: "user" },
      };

      await processor.processWebhook(payload1);
      await processor.processWebhook(payload2);

      const prEvents = processor.getEventHistory({ type: "pr_opened" });
      expect(prEvents.every((e) => e.type === "pr_opened")).toBe(true);
    });

    it("should limit results", async () => {
      for (let i = 0; i < 10; i++) {
        await processor.processWebhook({
          action: "opened",
          pull_request: {
            number: i,
            title: "PR",
            merged: false,
            user: { login: "user" },
            labels: [],
          },
          repository: { full_name: "owner/repo" },
          sender: { login: "user" },
        });
      }

      const history = processor.getEventHistory({ limit: 5 });
      expect(history.length).toBe(5);
    });
  });

  describe("getStats", () => {
    it("should return event statistics", async () => {
      await processor.processWebhook({
        action: "opened",
        pull_request: { number: 1, title: "PR1", merged: false, user: { login: "user" }, labels: [] },
        repository: { full_name: "owner/repo" },
        sender: { login: "user" },
      });

      await processor.processWebhook({
        action: "opened",
        pull_request: { number: 2, title: "PR2", merged: false, user: { login: "user" }, labels: [] },
        repository: { full_name: "owner/repo" },
        sender: { login: "user" },
      });

      const stats = processor.getStats();

      expect(stats.total).toBe(2);
      expect(stats.byType.pr_opened).toBe(2);
      expect(stats.bySeverity.info).toBe(2);
      expect(stats.byRepository["owner/repo"]).toBe(2);
    });
  });
});
