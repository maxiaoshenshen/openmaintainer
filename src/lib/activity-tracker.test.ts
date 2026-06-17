import { describe, it, expect, beforeEach } from "vitest";
import { ActivityTracker } from "./activity-tracker";

describe("ActivityTracker", () => {
  let tracker: ActivityTracker;

  beforeEach(() => {
    tracker = new ActivityTracker();
  });

  describe("track", () => {
    it("should track events", () => {
      tracker.track("pr_opened", "user1", "owner/repo");
      tracker.track("issue_closed", "user2", "owner/repo");

      const events = tracker.getRecentEvents();
      expect(events).toHaveLength(2);
    });

    it("should include metadata", () => {
      tracker.track("pr_opened", "user1", "owner/repo", { prNumber: 123 });
      
      const events = tracker.getRecentEvents();
      expect(events[0].metadata?.prNumber).toBe(123);
    });
  });

  describe("getMetrics", () => {
    it("should calculate metrics correctly", () => {
      tracker.track("pr_opened", "user1", "owner/repo");
      tracker.track("pr_opened", "user1", "owner/repo");
      tracker.track("issue_closed", "user2", "owner/repo");

      const metrics = tracker.getMetrics();

      expect(metrics.totalEvents).toBe(3);
      expect(metrics.eventsByType.pr_opened).toBe(2);
      expect(metrics.eventsByType.issue_closed).toBe(1);
      expect(metrics.contributorActivity.user1).toBe(2);
      expect(metrics.contributorActivity.user2).toBe(1);
    });

    it("should identify peak activity day", () => {
      const now = Date.now();
      tracker.track("pr_opened", "user1", "owner/repo");
      
      // Simulate yesterday
      tracker.track("pr_opened", "user1", "owner/repo");

      const metrics = tracker.getMetrics();
      expect(metrics.peakActivityDay).toBeTruthy();
    });

    it("should calculate average events per day", () => {
      for (let i = 0; i < 10; i++) {
        tracker.track("pr_opened", "user1", "owner/repo");
      }

      const metrics = tracker.getMetrics();
      expect(metrics.averageEventsPerDay).toBeGreaterThan(0);
    });
  });

  describe("getEventsByContributor", () => {
    it("should filter by contributor", () => {
      tracker.track("pr_opened", "user1", "owner/repo");
      tracker.track("issue_closed", "user2", "owner/repo");
      tracker.track("pr_merged", "user1", "owner/repo");

      const user1Events = tracker.getEventsByContributor("user1");
      expect(user1Events).toHaveLength(2);
    });
  });

  describe("getEventsByType", () => {
    it("should filter by type", () => {
      tracker.track("pr_opened", "user1", "owner/repo");
      tracker.track("issue_closed", "user2", "owner/repo");

      const prEvents = tracker.getEventsByType("pr_opened");
      expect(prEvents).toHaveLength(1);
    });
  });

  describe("clear", () => {
    it("should clear all events", () => {
      tracker.track("pr_opened", "user1", "owner/repo");
      tracker.clear();

      expect(tracker.getRecentEvents()).toHaveLength(0);
    });
  });
});
