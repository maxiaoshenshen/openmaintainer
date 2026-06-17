import { describe, it, expect } from 'vitest';
import { createReleaseManager } from './release-manager';

describe('release-manager', () => {
  const { generateReleasePlan, formatReleaseNotes, releaseStatuses, changeTypes } = createReleaseManager();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  describe('generateReleasePlan', () => {
    it('should generate release plan', () => {
      const plan = generateReleasePlan(mockRepo);
      
      expect(plan).toBeDefined();
      expect(plan.repository).toEqual(mockRepo);
      expect(plan.upcomingRelease).toBeDefined();
      expect(plan.releaseHistory).toBeDefined();
      expect(Array.isArray(plan.releaseHistory)).toBe(true);
    });

    it('should calculate readiness score', () => {
      const plan = generateReleasePlan(mockRepo);
      
      expect(plan.readinessScore).toBeGreaterThanOrEqual(0);
      expect(plan.readinessScore).toBeLessThanOrEqual(100);
    });

    it('should identify blockers for breaking changes', () => {
      const plan = generateReleasePlan(mockRepo);
      
      if (plan.upcomingRelease.changes.some(c => c.type === 'breaking')) {
        expect(plan.blockers.length).toBeGreaterThan(0);
      }
    });

    it('should generate changelog', () => {
      const plan = generateReleasePlan(mockRepo);
      
      expect(plan.changelog).toContain('# Changelog');
      expect(plan.changelog).toContain(plan.upcomingRelease.version);
    });
  });

  describe('formatReleaseNotes', () => {
    it('should format release notes', () => {
      const plan = generateReleasePlan(mockRepo);
      const notes = formatReleaseNotes(plan.upcomingRelease);
      
      expect(notes).toContain(plan.upcomingRelease.tagName);
      expect(notes).toContain('## Changes');
    });
  });

  describe('releaseStatuses', () => {
    it('should contain all release statuses', () => {
      expect(releaseStatuses).toContain('draft');
      expect(releaseStatuses).toContain('prerelease');
      expect(releaseStatuses).toContain('released');
      expect(releaseStatuses).toContain('cancelled');
    });
  });

  describe('changeTypes', () => {
    it('should contain all change types', () => {
      expect(changeTypes).toContain('feature');
      expect(changeTypes).toContain('bugfix');
      expect(changeTypes).toContain('breaking');
      expect(changeTypes).toContain('security');
      expect(changeTypes).toContain('performance');
      expect(changeTypes).toContain('docs');
    });
  });
});
