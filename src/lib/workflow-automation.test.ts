import { describe, it, expect } from "vitest";
import {
  createWorkflowRule,
  createDefaultWorkflows,
  evaluateConditions,
  executeWorkflow,
  buildWorkflowDashboard,
  suggestWorkflows,
  type WorkflowCondition,
} from "./workflow-automation";

describe("Workflow Automation", () => {
  describe("createWorkflowRule", () => {
    it("should create a workflow with required fields", () => {
      const workflow = createWorkflowRule({
        name: "Test Workflow",
        description: "Test description",
        enabled: true,
        trigger: "pr_opened",
        actions: [{ type: "add_labels", labels: ["test"] }],
        priority: 10,
      });

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe("Test Workflow");
      expect(workflow.trigger).toBe("pr_opened");
      expect(workflow.createdAt).toBeDefined();
      expect(workflow.updatedAt).toBeDefined();
    });
  });

  describe("createDefaultWorkflows", () => {
    it("should create default workflow rules", () => {
      const workflows = createDefaultWorkflows();
      
      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows.some(w => w.name === "Bug Triage")).toBe(true);
      expect(workflows.some(w => w.name === "First PR Welcome")).toBe(true);
      expect(workflows.every(w => w.enabled)).toBe(true);
    });

    it("should have valid triggers and actions", () => {
      const workflows = createDefaultWorkflows();
      
      for (const workflow of workflows) {
        expect(workflow.trigger).toBeDefined();
        expect(workflow.actions).toBeDefined();
        expect(Array.isArray(workflow.actions)).toBe(true);
      }
    });
  });

  describe("evaluateConditions", () => {
    it("should return true for empty conditions", () => {
      const result = evaluateConditions([], {});
      expect(result).toBe(true);
    });

    it("should evaluate equals condition", () => {
      const conditions: WorkflowCondition[] = [
        { field: "type", operator: "equals", value: "bug" },
      ];
      expect(evaluateConditions(conditions, { type: "bug" })).toBe(true);
      expect(evaluateConditions(conditions, { type: "feature" })).toBe(false);
    });

    it("should evaluate contains condition", () => {
      const conditions: WorkflowCondition[] = [
        { field: "title", operator: "contains", value: "bug" },
      ];
      expect(evaluateConditions(conditions, { title: "bug report" })).toBe(true);
      expect(evaluateConditions(conditions, { title: "Feature request" })).toBe(false);
    });

    it("should evaluate greater_than condition", () => {
      const conditions: WorkflowCondition[] = [
        { field: "age", operator: "greater_than", value: 10 },
      ];
      expect(evaluateConditions(conditions, { age: 15 })).toBe(true);
      expect(evaluateConditions(conditions, { age: 5 })).toBe(false);
    });

    it("should evaluate nested field access", () => {
      const conditions: WorkflowCondition[] = [
        { field: "author.isFirstContribution", operator: "equals", value: true },
      ];
      expect(evaluateConditions(conditions, { author: { isFirstContribution: true } })).toBe(true);
      expect(evaluateConditions(conditions, { author: { isFirstContribution: false } })).toBe(false);
    });

    it("should return true if any condition matches (OR logic)", () => {
      const conditions: WorkflowCondition[] = [
        { field: "title", operator: "contains", value: "bug" },
        { field: "title", operator: "contains", value: "crash" },
      ];
      expect(evaluateConditions(conditions, { title: "bug in login" })).toBe(true);
      expect(evaluateConditions(conditions, { title: "app crash" })).toBe(true);
      expect(evaluateConditions(conditions, { title: "New feature" })).toBe(false);
    });
  });

  describe("executeWorkflow", () => {
    it("should execute workflow and return execution", () => {
      const workflow = createWorkflowRule({
        name: "Test",
        enabled: true,
        trigger: "issue_opened",
        actions: [{ type: "add_labels", labels: ["test"] }],
        priority: 1,
      });

      const execution = executeWorkflow(
        workflow,
        "issue_opened",
        "123",
        "issue",
        { title: "Bug report" }
      );

      expect(execution.id).toBeDefined();
      expect(execution.workflowId).toBe(workflow.id);
      expect(execution.status).toBe("completed");
      expect(execution.actionsExecuted.length).toBeGreaterThan(0);
    });

    it("should not execute disabled workflow", () => {
      const workflow = createWorkflowRule({
        name: "Disabled",
        enabled: false,
        trigger: "issue_opened",
        actions: [{ type: "add_labels", labels: ["test"] }],
        priority: 1,
      });

      const execution = executeWorkflow(
        workflow,
        "issue_opened",
        "123",
        "issue",
        {}
      );

      expect(execution.status).toBe("failed");
      expect(execution.errors).toContain("Workflow is disabled");
    });

    it("should add size labels for PRs", () => {
      const workflow = createDefaultWorkflows().find(w => w.name === "PR Size Labels")!;

      const smallExecution = executeWorkflow(
        workflow,
        "pr_opened",
        "123",
        "pr",
        { additions: 50, deletions: 10 }
      );
      expect(smallExecution.actionsExecuted[0]).toEqual({ type: "add_labels", labels: ["size/s"] });

      const largeExecution = executeWorkflow(
        workflow,
        "pr_opened",
        "456",
        "pr",
        { additions: 3000, deletions: 1000 }
      );
      expect(largeExecution.actionsExecuted[0]).toEqual({ type: "add_labels", labels: ["size/l"] });
    });
  });

  describe("buildWorkflowDashboard", () => {
    it("should calculate workflow statistics", () => {
      const workflows = createDefaultWorkflows();
      const executions = [
        {
          id: "1",
          workflowId: workflows[0].id,
          trigger: "pr_opened" as const,
          targetId: "1",
          targetType: "pr" as const,
          status: "completed" as const,
          actionsExecuted: [],
          startedAt: Date.now() - 1000,
          completedAt: Date.now(),
        },
        {
          id: "2",
          workflowId: workflows[1].id,
          trigger: "issue_opened" as const,
          targetId: "2",
          targetType: "issue" as const,
          status: "failed" as const,
          actionsExecuted: [],
          startedAt: Date.now(),
          errors: ["Test error"],
        },
      ];

      const dashboard = buildWorkflowDashboard(workflows, executions);

      expect(dashboard.stats.totalExecutions).toBe(2);
      expect(dashboard.stats.successRate).toBe(50);
      expect(dashboard.activeCount).toBe(workflows.filter(w => w.enabled).length);
      expect(dashboard.recentExecutions.length).toBeLessThanOrEqual(10);
    });
  });

  describe("suggestWorkflows", () => {
    it("should suggest workflows based on repository activity", () => {
      const mockRepo = {
        name: "test-repo",
        fullName: "test/repo",
        owner: "test",
        issues: Array(15).fill({ state: "open" }),
        pullRequests: Array(3).fill({ state: "open" }),
      } as any;

      const suggestions = suggestWorkflows(mockRepo);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.workflow.name === "Issue Stale Detection")).toBe(true);
    });

    it("should not suggest stale detection for low issue count", () => {
      const mockRepo = {
        name: "test-repo",
        fullName: "test/repo",
        owner: "test",
        issues: Array(5).fill({ state: "open" }),
        pullRequests: [],
      } as any;

      const suggestions = suggestWorkflows(mockRepo);
      
      expect(suggestions.some(s => s.workflow.name === "Issue Stale Detection")).toBe(false);
    });
  });
});
