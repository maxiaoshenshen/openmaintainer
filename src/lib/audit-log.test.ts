import { describe, it, expect } from "vitest";
import {
  generateAuditId,
  createAuditEvent,
  filterAuditEvents,
  generateAuditSummary,
  exportAuditLog,
} from "./audit-log";

describe("Audit Log", () => {
  describe("generateAuditId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateAuditId();
      const id2 = generateAuditId();
      
      expect(id1).toMatch(/^audit_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("createAuditEvent", () => {
    it("should create valid audit event", () => {
      const event = createAuditEvent(
        { id: "1", username: "testuser", type: "user" },
        "issue.created",
        { type: "issue", id: "123", name: "Test Issue" }
      );

      expect(event.id).toMatch(/^audit_/);
      expect(event.timestamp).toBeDefined();
      expect(event.actor.username).toBe("testuser");
      expect(event.action).toBe("issue.created");
      expect(event.resource.id).toBe("123");
    });

    it("should include optional fields", () => {
      const event = createAuditEvent(
        { id: "1", username: "bot", type: "bot" },
        "release.published",
        { type: "release", id: "v1.0.0" },
        {
          changes: [{ field: "version", oldValue: "0.9.0", newValue: "1.0.0" }],
          metadata: { ci: true },
          ipAddress: "192.168.1.1",
        }
      );

      expect(event.changes).toHaveLength(1);
      expect(event.metadata?.ci).toBe(true);
      expect(event.ipAddress).toBe("192.168.1.1");
    });
  });

  describe("filterAuditEvents", () => {
    const events = [
      createAuditEvent({ id: "1", username: "alice", type: "user" }, "issue.created", { type: "issue", id: "1" }),
      createAuditEvent({ id: "2", username: "bob", type: "user" }, "issue.closed", { type: "issue", id: "2" }),
      createAuditEvent({ id: "3", username: "alice", type: "user" }, "pr.opened", { type: "pr", id: "1" }),
    ];

    it("should filter by actor", () => {
      const filtered = filterAuditEvents(events, { actor: "alice" });
      expect(filtered).toHaveLength(2);
    });

    it("should filter by action", () => {
      const filtered = filterAuditEvents(events, { action: "issue.created" });
      expect(filtered).toHaveLength(1);
    });

    it("should filter by resource type", () => {
      const filtered = filterAuditEvents(events, { resourceType: "issue" });
      expect(filtered).toHaveLength(2);
    });
  });

  describe("generateAuditSummary", () => {
    it("should generate summary statistics", () => {
      const events = [
        createAuditEvent({ id: "1", username: "alice", type: "user" }, "issue.created", { type: "issue", id: "1" }),
        createAuditEvent({ id: "2", username: "bob", type: "user" }, "issue.created", { type: "issue", id: "2" }),
        createAuditEvent({ id: "3", username: "alice", type: "user" }, "pr.opened", { type: "pr", id: "1" }),
      ];

      const summary = generateAuditSummary(events);

      expect(summary.totalEvents).toBe(3);
      expect(summary.eventsByType["issue.created"]).toBe(2);
      expect(summary.eventsByActor["alice"]).toBe(2);
    });
  });

  describe("exportAuditLog", () => {
    it("should export as JSON", () => {
      const events = [
        createAuditEvent({ id: "1", username: "test", type: "user" }, "issue.created", { type: "issue", id: "1" }),
      ];
      
      const json = exportAuditLog(events, "json");
      expect(json).toContain("issue.created");
    });

    it("should export as CSV", () => {
      const events = [
        createAuditEvent({ id: "1", username: "test", type: "user" }, "issue.created", { type: "issue", id: "1" }),
      ];
      
      const csv = exportAuditLog(events, "csv");
      expect(csv).toContain("ID,Timestamp,Actor,Action");
      expect(csv).toContain("test");
    });
  });
});
