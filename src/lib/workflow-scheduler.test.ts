import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkflowScheduler, createWorkflow, parseCron } from "./workflow-scheduler";

describe("Workflow Scheduler", () => {
  let scheduler: WorkflowScheduler;

  beforeEach(() => {
    scheduler = new WorkflowScheduler();
  });

  afterEach(() => {
    // Clean up any scheduled timers
    const scheduled = scheduler.getScheduledWorkflows();
    for (const sw of scheduled) {
      scheduler.unregister(sw.workflow.id);
    }
  });

  describe("register", () => {
    it("should register a workflow", () => {
      const workflow = createWorkflow(
        "test-workflow",
        "Test Workflow",
        "A test workflow",
        { interval: 60000, enabled: true },
        [{ type: "notify", config: { message: "Hello" } }]
      );

      scheduler.register(workflow);
      expect(scheduler.getWorkflow("test-workflow")).toBeDefined();
    });

    it("should track executions", () => {
      const workflow = createWorkflow(
        "exec-test",
        "Exec Test",
        "Test execution tracking",
        { enabled: false },
        [{ type: "notify", config: {} }]
      );

      scheduler.register(workflow);
      expect(scheduler.getExecutions("exec-test")).toHaveLength(0);
    });
  });

  describe("execute", () => {
    it("should execute workflow and track status", async () => {
      const workflow = createWorkflow(
        "simple-workflow",
        "Simple Workflow",
        "A simple workflow",
        { enabled: false },
        [{ type: "notify", config: { message: "Done" } }]
      );

      scheduler.register(workflow);
      const execution = await scheduler.execute("simple-workflow", "manual");

      expect(execution.status).toBe("completed");
      expect(execution.workflowId).toBe("simple-workflow");
      expect(execution.triggeredBy).toBe("manual");
    });

    it("should throw error for non-existent workflow", async () => {
      await expect(
        scheduler.execute("non-existent", "manual")
      ).rejects.toThrow("Workflow non-existent not found");
    });

    it("should record execution in history", async () => {
      const workflow = createWorkflow(
        "history-test",
        "History Test",
        "Test execution history",
        { enabled: false },
        [{ type: "notify", config: {} }]
      );

      scheduler.register(workflow);
      await scheduler.execute("history-test", "manual");

      const executions = scheduler.getExecutions("history-test");
      expect(executions).toHaveLength(1);
    });
  });

  describe("pause and resume", () => {
    it("should pause workflow", () => {
      const workflow = createWorkflow(
        "pause-test",
        "Pause Test",
        "Test pause",
        { interval: 1000, enabled: true },
        [{ type: "notify", config: {} }]
      );

      scheduler.register(workflow);
      scheduler.pauseWorkflow("pause-test");

      const w = scheduler.getWorkflow("pause-test");
      expect(w?.schedule.enabled).toBe(false);
    });

    it("should resume paused workflow", () => {
      const workflow = createWorkflow(
        "resume-test",
        "Resume Test",
        "Test resume",
        { interval: 1000, enabled: true },
        [{ type: "notify", config: {} }]
      );

      scheduler.register(workflow);
      scheduler.pauseWorkflow("resume-test");
      scheduler.resumeWorkflow("resume-test");

      const w = scheduler.getWorkflow("resume-test");
      expect(w?.schedule.enabled).toBe(true);
    });
  });

  describe("parseCron", () => {
    it("should parse minute interval cron", () => {
      const { interval } = parseCron("*/5 * * * *");
      expect(interval).toBeGreaterThanOrEqual(60000);
    });

    it("should return default for unknown cron", () => {
      const { interval } = parseCron("0 0 * * *");
      expect(interval).toBe(60000);
    });
  });

  describe("getScheduledWorkflows", () => {
    it("should list all scheduled workflows", () => {
      const workflow = createWorkflow(
        "scheduled",
        "Scheduled",
        "Has schedule",
        { interval: 1000, enabled: true },
        [{ type: "notify", config: {} }]
      );

      scheduler.register(workflow);
      const scheduled = scheduler.getScheduledWorkflows();

      expect(scheduled.length).toBeGreaterThan(0);
    });
  });
});
