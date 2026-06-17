import { describe, it, expect, beforeEach } from "vitest";
import { webhookEngine, WebhookAutomationEngine, type WebhookEvent } from "./webhook-handler";

describe("WebhookAutomationEngine", () => {
  let engine: WebhookAutomationEngine;

  beforeEach(() => {
    engine = new WebhookAutomationEngine();
  });

  describe("addRule and removeRule", () => {
    it("should add and retrieve rules", () => {
      engine.addRule({
        id: "test-rule",
        name: "Test Rule",
        trigger: "issue.opened",
        conditions: [],
        actions: [{ type: "add_label", value: "test" }],
        enabled: true,
      });
      const rules = engine.getRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("test-rule");
    });

    it("should remove rules by id", () => {
      engine.addRule({
        id: "test-rule",
        name: "Test Rule",
        trigger: "issue.opened",
        conditions: [],
        actions: [{ type: "add_label", value: "test" }],
        enabled: true,
      });
      engine.removeRule("test-rule");
      expect(engine.getRules()).toHaveLength(0);
    });
  });

  describe("evaluateRules", () => {
    it("should trigger rules matching issue.opened", () => {
      engine.addRule({
        id: "label-bug",
        name: "Label bugs",
        trigger: "issue.opened",
        conditions: [
          { type: "title", operator: "contains", value: "bug" },
        ],
        actions: [{ type: "add_label", value: "bug" }],
        enabled: true,
      });

      const event: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        issue: {
          number: 1,
          title: "Bug: something is broken",
          body: "Description",
          state: "open",
          labels: [],
          assignees: [],
        },
      };

      const actions = engine.evaluateRules(event);
      expect(actions.length).toBe(1);
      expect(actions[0]).toContainEqual({ type: "add_label", value: "bug" });
    });

    it("should not trigger disabled rules", () => {
      engine.addRule({
        id: "test-rule",
        name: "Test Rule",
        trigger: "issue.opened",
        conditions: [],
        actions: [{ type: "add_label", value: "test" }],
        enabled: false,
      });

      const event: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        issue: {
          number: 1,
          title: "Test issue",
          body: "",
          state: "open",
          labels: [],
          assignees: [],
        },
      };

      const actions = engine.evaluateRules(event);
      expect(actions.length).toBe(0);
    });

    it("should trigger PR rules", () => {
      engine.addRule({
        id: "label-enhancement",
        name: "Label enhancements",
        trigger: "pr.opened",
        conditions: [
          { type: "title", operator: "contains", value: "feat" },
        ],
        actions: [{ type: "add_label", value: "enhancement" }],
        enabled: true,
      });

      const event: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        pull_request: {
          number: 1,
          title: "feat: add new feature",
          body: "",
          state: "open",
          merged: false,
          labels: [],
        },
      };

      const actions = engine.evaluateRules(event);
      expect(actions.length).toBe(1);
    });
  });

  describe("condition evaluation", () => {
    it("should evaluate contains operator (case-insensitive)", () => {
      engine.addRule({
        id: "test",
        name: "Test",
        trigger: "issue.opened",
        conditions: [
          { type: "title", operator: "contains", value: "error" },
        ],
        actions: [{ type: "add_label", value: "bug" }],
        enabled: true,
      });

      const matchingEvent: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        issue: { number: 1, title: "This has an error", body: "", state: "open", labels: [], assignees: [] },
      };

      const nonMatchingEvent: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        issue: { number: 1, title: "This is fine", body: "", state: "open", labels: [], assignees: [] },
      };

      expect(engine.evaluateRules(matchingEvent).length).toBe(1);
      expect(engine.evaluateRules(nonMatchingEvent).length).toBe(0);
    });

    it("should evaluate equals operator (case-insensitive)", () => {
      engine.addRule({
        id: "test",
        name: "Test",
        trigger: "issue.opened",
        conditions: [
          { type: "title", operator: "equals", value: "critical bug" },
        ],
        actions: [{ type: "add_label", value: "priority" }],
        enabled: true,
      });

      // Both should match because comparison is case-insensitive
      const event1: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        issue: { number: 1, title: "critical bug", body: "", state: "open", labels: [], assignees: [] },
      };

      const event2: WebhookEvent = {
        action: "opened",
        repository: { owner: "test", name: "repo", fullName: "test/repo" },
        sender: { login: "user", type: "User" },
        issue: { number: 1, title: "Critical Bug", body: "", state: "open", labels: [], assignees: [] },
      };

      expect(engine.evaluateRules(event1).length).toBe(1);
      expect(engine.evaluateRules(event2).length).toBe(1);
    });
  });
});

describe("default webhookEngine", () => {
  it("should have default rules configured", () => {
    const rules = webhookEngine.getRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it("should auto-label bug reports", () => {
    const event: WebhookEvent = {
      action: "opened",
      repository: { owner: "test", name: "repo", fullName: "test/repo" },
      sender: { login: "user", type: "User" },
      issue: { number: 1, title: "Bug in login", body: "", state: "open", labels: [], assignees: [] },
    };
    
    const actions = webhookEngine.evaluateRules(event);
    const hasBugLabel = actions.some((actionList) => 
      actionList.some((action) => action.type === "add_label" && action.value === "bug")
    );
    expect(hasBugLabel).toBe(true);
  });
});
