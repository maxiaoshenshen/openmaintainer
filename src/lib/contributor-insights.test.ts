import { describe, it, expect } from 'vitest';
import { ContributorInsights, contributorInsights } from './contributor-insights';

describe('ContributorInsights', () => {
  const insights = new ContributorInsights();

  describe('getContributorProfile', () => {
    it('should get contributor profile', async () => {
      const profile = await insights.getContributorProfile('octocat');
      
      expect(profile).toHaveProperty('username', 'octocat');
      expect(profile).toHaveProperty('avatarUrl');
      expect(profile).toHaveProperty('contributions');
      expect(profile).toHaveProperty('tier');
      expect(profile).toHaveProperty('skills');
      expect(profile).toHaveProperty('preferredAreas');
    });

    it('should cache contributor data', async () => {
      const profile1 = await insights.getContributorProfile('testuser');
      const profile2 = await insights.getContributorProfile('testuser');
      expect(profile1).toBe(profile2);
    });
  });

  describe('analyzeGrowth', () => {
    it('should analyze contributor growth', async () => {
      const growth = await insights.analyzeGrowth('contributor', 30);
      
      expect(growth).toHaveProperty('contributor', 'contributor');
      expect(growth).toHaveProperty('period');
      expect(growth).toHaveProperty('growthRate');
      expect(growth).toHaveProperty('mostActivePeriod');
    });
  });

  describe('identifySkillGaps', () => {
    it('should identify skill gaps', async () => {
      const contributors = [
        { username: 'u1', avatarUrl: '', contributions: 100, joinedAt: new Date(), lastContribution: new Date(), tier: 'veteran' as const, skills: ['TypeScript'], preferredAreas: [] },
        { username: 'u2', avatarUrl: '', contributions: 50, joinedAt: new Date(), lastContribution: new Date(), tier: 'regular' as const, skills: ['React'], preferredAreas: [] }
      ];
      const gaps = await insights.identifySkillGaps(contributors);
      
      expect(Array.isArray(gaps)).toBe(true);
      gaps.forEach(gap => {
        expect(gap).toHaveProperty('skill');
        expect(gap).toHaveProperty('demand');
        expect(gap).toHaveProperty('priority');
      });
    });
  });

  describe('matchContributorsToTasks', () => {
    it('should match contributors to tasks', async () => {
      const tasks = [
        { title: 'Fix bug', difficulty: 'easy', skills: ['JavaScript'] },
        { title: 'Add feature', difficulty: 'medium', skills: ['TypeScript', 'React'] }
      ];
      const matches = await insights.matchContributorsToTasks(tasks);
      
      expect(Array.isArray(matches)).toBe(true);
      matches.forEach(match => {
        expect(match).toHaveProperty('contributor');
        expect(match).toHaveProperty('matchScore');
        expect(match).toHaveProperty('matchedSkills');
      });
    });
  });

  describe('calculateRetentionMetrics', () => {
    it('should calculate retention metrics', async () => {
      const metrics = await insights.calculateRetentionMetrics(30);
      
      expect(metrics).toHaveProperty('totalContributors');
      expect(metrics).toHaveProperty('retentionRate');
      expect(metrics).toHaveProperty('newVsChurned');
      expect(metrics.retentionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.retentionRate).toBeLessThanOrEqual(100);
    });
  });

  describe('findMentors', () => {
    it('should find mentors for new contributors', async () => {
      const newContributor = await insights.getContributorProfile('newcomer');
      const mentors = await insights.findMentors(newContributor);
      
      expect(Array.isArray(mentors)).toBe(true);
    });
  });

  describe('trackOnboardingProgress', () => {
    it('should track onboarding progress', async () => {
      const contributor = await insights.getContributorProfile('newbie');
      const progress = await insights.trackOnboardingProgress(contributor);
      
      expect(Array.isArray(progress)).toBe(true);
      progress.forEach(m => {
        expect(m).toHaveProperty('milestone');
        expect(m).toHaveProperty('completed');
      });
    });
  });
});
