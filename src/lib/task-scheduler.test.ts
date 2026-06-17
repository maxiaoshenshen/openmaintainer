import { describe, it, expect, beforeEach } from "vitest";
import { TaskScheduler } from "./task-scheduler";

describe("TaskScheduler", () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler({ maxConcurrent: 2 });
  });

  describe("addTask", () => {
    it("should add a task", () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});

      expect(task.name).toBe("test");
      expect(task.enabled).toBe(true);
      expect(task.status).toBe("pending");
    });

    it("should generate unique task IDs", () => {
      const task1 = scheduler.addTask("test1", "* * * * *", async () => {});
      const task2 = scheduler.addTask("test2", "* * * * *", async () => {});

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe("enable/disable", () => {
    it("should enable a task", () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});
      scheduler.disableTask(task.id);
      
      expect(scheduler.getTask(task.id)?.enabled).toBe(false);

      scheduler.enableTask(task.id);
      expect(scheduler.getTask(task.id)?.enabled).toBe(true);
    });

    it("should disable a task", () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});
      
      scheduler.disableTask(task.id);
      expect(scheduler.getTask(task.id)?.enabled).toBe(false);
    });
  });

  describe("executeTask", () => {
    it("should execute a task successfully", async () => {
      let executed = false;
      const task = scheduler.addTask("test", "* * * * *", async () => {
        executed = true;
      });

      const run = await scheduler.executeTask(task.id);

      expect(executed).toBe(true);
      expect(run?.status).toBe("completed");
    });

    it("should record failed tasks", async () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {
        throw new Error("Task failed");
      });

      const run = await scheduler.executeTask(task.id);

      expect(run?.status).toBe("failed");
      expect(run?.error).toBe("Task failed");
    });

    it("should track last run time", async () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});

      await scheduler.executeTask(task.id);

      expect(scheduler.getTask(task.id)?.lastRun).toBeDefined();
    });
  });

  describe("removeTask", () => {
    it("should remove a task", () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});
      
      scheduler.removeTask(task.id);
      expect(scheduler.getTask(task.id)).toBeUndefined();
    });
  });

  describe("getStats", () => {
    it("should return correct stats", async () => {
      scheduler.addTask("test1", "* * * * *", async () => {});
      scheduler.addTask("test2", "* * * * *", async () => {});

      const task = scheduler.addTask("test3", "* * * * *", async () => {});
      await scheduler.executeTask(task.id);

      const stats = scheduler.getStats();

      expect(stats.total).toBe(3);
      expect(stats.enabled).toBe(3);
      expect(stats.completed).toBe(1);
    });
  });

  describe("getTaskRuns", () => {
    it("should return task runs", async () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});
      
      await scheduler.executeTask(task.id);
      await scheduler.executeTask(task.id);

      const runs = scheduler.getTaskRuns(task.id);
      expect(runs.length).toBe(2);
    });

    it("should limit runs", async () => {
      const task = scheduler.addTask("test", "* * * * *", async () => {});
      
      for (let i = 0; i < 5; i++) {
        await scheduler.executeTask(task.id);
      }

      const runs = scheduler.getTaskRuns(task.id, 3);
      expect(runs.length).toBe(3);
    });
  });
});
