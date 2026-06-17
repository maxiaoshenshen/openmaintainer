import { describe, it, expect, beforeEach } from 'vitest';
import { CronScheduler } from './cron-scheduler';

describe('CronScheduler', () => {
  let scheduler: CronScheduler;

  beforeEach(() => {
    scheduler = new CronScheduler();
  });

  describe('parseCronExpression', () => {
    it('should parse standard cron expression', () => {
      const result = scheduler.parseCronExpression('0 * * * *');
      expect(result).not.toBeNull();
      expect(result?.minute).toEqual([0]);
      expect(result?.hour).toContain(0);
    });

    it('should parse cron with step values', () => {
      const result = scheduler.parseCronExpression('*/5 * * * *');
      expect(result?.minute).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    });

    it('should parse cron with ranges', () => {
      const result = scheduler.parseCronExpression('0 9-17 * * 1-5');
      expect(result?.hour).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
      expect(result?.dayOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return null for invalid expression', () => {
      expect(scheduler.parseCronExpression('invalid')).toBeNull();
      expect(scheduler.parseCronExpression('*')).toBeNull();
    });
  });

  describe('validateCronExpression', () => {
    it('should validate correct expressions', () => {
      expect(scheduler.validateCronExpression('0 0 * * *')).toBe(true);
      expect(scheduler.validateCronExpression('*/15 * * * *')).toBe(true);
      expect(scheduler.validateCronExpression('0 9-17 * * 1-5')).toBe(true);
    });

    it('should reject invalid expressions', () => {
      expect(scheduler.validateCronExpression('bad')).toBe(false);
      // Note: simplified validation only checks part count
    });
  });

  describe('scheduleTask', () => {
    it('should schedule a new task', () => {
      const task = scheduler.scheduleTask('daily', 'Daily Job', '0 0 * * *');
      expect(task).not.toBeNull();
      expect(task?.id).toBe('daily');
      expect(task?.enabled).toBe(true);
    });

    it('should return null for invalid cron', () => {
      expect(scheduler.scheduleTask('bad', 'Bad Job', 'invalid')).toBeNull();
    });
  });

  describe('getTask', () => {
    it('should return scheduled task', () => {
      scheduler.scheduleTask('test', 'Test', '0 * * * *');
      const task = scheduler.getTask('test');
      expect(task).toBeDefined();
      expect(task?.name).toBe('Test');
    });

    it('should return undefined for non-existent task', () => {
      expect(scheduler.getTask('non-existent')).toBeUndefined();
    });
  });

  describe('listTasks', () => {
    it('should list all scheduled tasks', () => {
      scheduler.scheduleTask('task1', 'Task 1', '0 * * * *');
      scheduler.scheduleTask('task2', 'Task 2', '0 0 * * *');
      const tasks = scheduler.listTasks();
      expect(tasks).toHaveLength(2);
    });
  });

  describe('updateTask', () => {
    it('should update task properties', () => {
      scheduler.scheduleTask('update-test', 'Original', '0 * * * *');
      const updated = scheduler.updateTask('update-test', {
        name: 'Updated',
        enabled: false
      });
      expect(updated?.name).toBe('Updated');
      expect(updated?.enabled).toBe(false);
    });

    it('should reject invalid cron in update', () => {
      scheduler.scheduleTask('test', 'Test', '0 * * * *');
      expect(scheduler.updateTask('test', { cronExpression: 'bad' })).toBeNull();
    });
  });

  describe('unscheduleTask', () => {
    it('should remove scheduled task', () => {
      scheduler.scheduleTask('remove', 'Remove', '0 * * * *');
      expect(scheduler.unscheduleTask('remove')).toBe(true);
      expect(scheduler.getTask('remove')).toBeUndefined();
    });

    it('should return false for non-existent task', () => {
      expect(scheduler.unscheduleTask('non-existent')).toBe(false);
    });
  });

  describe('executeTask', () => {
    it('should execute a task', async () => {
      scheduler.scheduleTask('exec', 'Execute', '0 * * * *');
      const execution = await scheduler.executeTask('exec');
      expect(execution.status).toBeDefined();
    });

    it('should return failed for non-existent task', async () => {
      const execution = await scheduler.executeTask('non-existent');
      expect(execution.status).toBe('failed');
      expect(execution.error).toBe('Task not found');
    });
  });

  describe('isTaskRunning', () => {
    it('should return false for non-running task', () => {
      scheduler.scheduleTask('idle', 'Idle', '0 * * * *');
      expect(scheduler.isTaskRunning('idle')).toBe(false);
    });
  });

  describe('getSchedulerStats', () => {
    it('should return correct statistics', () => {
      scheduler.scheduleTask('stat1', 'Stat 1', '0 * * * *');
      scheduler.scheduleTask('stat2', 'Stat 2', '0 0 * * *');
      scheduler.scheduleTask('stat3', 'Stat 3', '0 0 * * *');
      scheduler.updateTask('stat3', { enabled: false });
      
      const stats = scheduler.getSchedulerStats();
      expect(stats.totalTasks).toBe(3);
      expect(stats.enabledTasks).toBe(2);
    });
  });
});
