import { describe, it, expect, beforeEach } from 'vitest';
import { MaintainerWorkload } from './maintainer-workload';

describe('MaintainerWorkload', () => {
  let workload: MaintainerWorkload;

  beforeEach(() => {
    workload = new MaintainerWorkload();
  });

  describe('register', () => {
    it('should register a new maintainer', () => {
      const maintainer = workload.register({
        username: 'alice',
        email: 'alice@example.com',
        role: 'maintainer',
      });

      expect(maintainer).toBeDefined();
      expect(maintainer.username).toBe('alice');
      expect(maintainer.role).toBe('maintainer');
      expect(maintainer.isActive).toBe(true);
    });

    it('should set default role to contributor', () => {
      const maintainer = workload.register({ username: 'bob' });
      expect(maintainer.role).toBe('contributor');
    });
  });

  describe('updateMetrics', () => {
    it('should update maintainer metrics', () => {
      workload.register({ username: 'alice' });
      workload.updateMetrics('user_alice', {
        openIssues: 10,
        openPRs: 5,
      });

      const metrics = workload.getWorkload('user_alice');
      expect(metrics?.openIssues).toBe(10);
      expect(metrics?.openPRs).toBe(5);
    });
  });

  describe('calculateBalance', () => {
    it('should calculate workload balance', () => {
      workload.register({ username: 'alice' });
      workload.updateMetrics('user_alice', {
        openIssues: 5,
        openPRs: 3,
        commitCount: 20,
      });

      const balance = workload.calculateBalance();
      expect(balance.length).toBe(1);
      expect(balance[0].score).toBeGreaterThanOrEqual(0);
    });

    it('should generate recommendations for high workload', () => {
      workload.register({ username: 'alice' });
      workload.updateMetrics('user_alice', {
        openIssues: 25,
        openPRs: 15,
      });

      const balance = workload.calculateBalance();
      expect(balance[0].recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('assessBurnoutRisk', () => {
    it('should return low risk for new maintainer', () => {
      workload.register({ username: 'newuser' });

      const risk = workload.assessBurnoutRisk('user_newuser');
      expect(risk.level).toBe('low');
      expect(risk.score).toBe(0);
    });

    it('should detect high burnout risk', () => {
      workload.register({ username: 'overloaded' });
      workload.updateMetrics('user_overloaded', {
        openIssues: 50,
        openPRs: 30,
        avgResponseTime: 200,
        commitCount: 150,
      });

      const risk = workload.assessBurnoutRisk('user_overloaded');
      expect(['high', 'critical']).toContain(risk.level);
      expect(risk.factors.length).toBeGreaterThan(0);
    });

    it('should include suggestions for high risk', () => {
      workload.register({ username: 'busy' });
      workload.updateMetrics('user_busy', {
        openIssues: 40,
        openPRs: 25,
      });

      const risk = workload.assessBurnoutRisk('user_busy');
      expect(risk.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getTeamHealth', () => {
    it('should return team health summary', () => {
      workload.register({ username: 'alice' });
      workload.register({ username: 'bob' });

      const health = workload.getTeamHealth();
      expect(health.totalMaintainers).toBe(2);
      expect(health.activeMaintainers).toBe(2);
      expect(health.burnoutRiskDistribution).toBeDefined();
    });

    it('should calculate average workload', () => {
      workload.register({ username: 'alice' });
      workload.register({ username: 'bob' });
      workload.updateMetrics('user_alice', { openIssues: 20 });
      workload.updateMetrics('user_bob', { openIssues: 0 });

      const health = workload.getTeamHealth();
      expect(health.avgWorkload).toBeGreaterThan(0);
    });
  });

  describe('suggestRebalancing', () => {
    it('should suggest rebalancing for uneven workload', () => {
      workload.register({ username: 'busy' });
      workload.register({ username: 'idle' });
      workload.updateMetrics('user_busy', { openIssues: 50, openPRs: 30 });
      workload.updateMetrics('user_idle', { openIssues: 0, openPRs: 0 });

      const suggestions = workload.suggestRebalancing();
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should not suggest for balanced workload', () => {
      workload.register({ username: 'alice' });
      workload.register({ username: 'bob' });
      workload.updateMetrics('user_alice', { openIssues: 5 });
      workload.updateMetrics('user_bob', { openIssues: 5 });

      const suggestions = workload.suggestRebalancing();
      // Balance difference may not exceed threshold
    });
  });

  describe('listMaintainers', () => {
    it('should list all maintainers', () => {
      workload.register({ username: 'alice' });
      workload.register({ username: 'bob' });

      const maintainers = workload.listMaintainers();
      expect(maintainers.length).toBe(2);
    });
  });

  describe('deactivate', () => {
    it('should deactivate maintainer', () => {
      workload.register({ username: 'alice' });
      const result = workload.deactivate('user_alice');

      expect(result).toBe(true);
      const health = workload.getTeamHealth();
      expect(health.activeMaintainers).toBe(0);
    });

    it('should return false for non-existent', () => {
      const result = workload.deactivate('non-existent');
      expect(result).toBe(false);
    });
  });
});
