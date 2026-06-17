import { describe, it, expect } from 'vitest';
import { createReleaseManager, compareVersions } from './release-orchestrator';

describe('release-orchestrator', () => {
  describe('version management', () => {
    it('should parse semver versions', () => {
      const manager = createReleaseManager({});
      manager.setCurrentVersion('1.2.3');
      
      const parsed = manager.parseVersion('1.2.3');
      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(2);
      expect(parsed.patch).toBe(3);
    });

    it('should bump major version', () => {
      const manager = createReleaseManager({});
      manager.setCurrentVersion('1.2.3');
      
      expect(manager.bumpVersion('major')).toBe('2.0.0');
    });

    it('should bump minor version', () => {
      const manager = createReleaseManager({});
      manager.setCurrentVersion('1.2.3');
      
      expect(manager.bumpVersion('minor')).toBe('1.3.0');
    });

    it('should bump patch version', () => {
      const manager = createReleaseManager({});
      manager.setCurrentVersion('1.2.3');
      
      expect(manager.bumpVersion('patch')).toBe('1.2.4');
    });

    it('should handle pre-release versions', () => {
      const manager = createReleaseManager({});
      manager.setCurrentVersion('1.2.3');
      
      expect(manager.bumpVersion('minor', 'alpha')).toBe('1.3.0-alpha');
    });
  });

  describe('release planning', () => {
    it('should plan a minor release', () => {
      const manager = createReleaseManager({});
      manager.setCurrentVersion('1.2.3');
      
      const plan = manager.planRelease('minor', {
        features: ['New dark mode'],
        fixes: ['Fix login bug'],
      });
      
      expect(plan.version).toBe('1.3.0');
      expect(plan.type).toBe('minor');
      expect(plan.changes.features).toContain('New dark mode');
    });

    it('should calculate future release dates', () => {
      const manager = createReleaseManager({});
      
      const patchPlan = manager.planRelease('patch');
      const minorPlan = manager.planRelease('minor');
      const majorPlan = manager.planRelease('major');
      
      expect(patchPlan.releaseDate.getTime()).toBeGreaterThan(Date.now());
      expect(minorPlan.releaseDate.getTime()).toBeGreaterThan(patchPlan.releaseDate.getTime());
      expect(majorPlan.releaseDate.getTime()).toBeGreaterThan(minorPlan.releaseDate.getTime());
    });
  });

  describe('changelog generation', () => {
    it('should generate changelog sections', () => {
      const manager = createReleaseManager({});
      
      const changelog = manager.generateChangelog({
        features: ['New feature'],
        fixes: ['Bug fix'],
        breaking: [],
        dependencies: [],
      });
      
      expect(changelog).toContain('### Added');
      expect(changelog).toContain('New feature');
      expect(changelog).toContain('### Fixed');
      expect(changelog).toContain('Bug fix');
    });
  });

  describe('release notes', () => {
    it('should generate release notes', () => {
      const manager = createReleaseManager({
        owner: 'testowner',
        repo: 'testrepo',
      });
      manager.setCurrentVersion('1.0.0');
      
      const plan = manager.planRelease('minor', {
        features: ['Awesome feature'],
        fixes: [],
        breaking: [],
        dependencies: [],
      });
      
      const notes = manager.generateReleaseNotes(plan);
      expect(notes).toContain('1.1.0');
      expect(notes).toContain('Awesome feature');
      expect(notes).toContain('testowner/testrepo');
    });
  });

  describe('announcements', () => {
    it('should generate Twitter announcement', () => {
      const manager = createReleaseManager({
        owner: 'testowner',
        repo: 'testrepo',
      });
      
      const plan = manager.planRelease('major', {
        features: ['Big feature'],
        fixes: [],
        breaking: [],
        dependencies: [],
      });
      
      const announcement = manager.generateAnnouncement(plan);
      expect(announcement.twitter).toContain('Major');
      expect(announcement.twitter).toContain('Big feature');
    });
  });

  describe('release readiness', () => {
    it('should validate release readiness', () => {
      const manager = createReleaseManager({});
      
      const plan = manager.planRelease('minor', {
        features: [],
        fixes: ['Fix bug'],
        breaking: [],
        dependencies: [],
      });
      plan.checklist.tested = true;
      plan.checklist.documented = true;
      
      const readiness = manager.validateReleaseReadiness(plan);
      expect(readiness.ready).toBe(true);
      expect(readiness.blockers).toHaveLength(0);
    });

    it('should catch missing tests', () => {
      const manager = createReleaseManager({});
      
      const plan = manager.planRelease('patch', {
        features: [],
        fixes: ['Fix bug'],
        breaking: [],
        dependencies: [],
      });
      
      const readiness = manager.validateReleaseReadiness(plan);
      expect(readiness.ready).toBe(false);
      expect(readiness.blockers).toContain('Tests must pass before release');
    });

    it('should warn about features in patch', () => {
      const manager = createReleaseManager({});
      
      const plan = manager.planRelease('patch', {
        features: ['New feature'],
        fixes: [],
        breaking: [],
        dependencies: [],
      });
      plan.checklist.tested = true;
      
      const readiness = manager.validateReleaseReadiness(plan);
      expect(readiness.warnings).toContain(
        'New features typically warrant a minor version bump'
      );
    });
  });

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.1.0', '1.0.1')).toBe(1);
    });

    it('should handle v prefix', () => {
      expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
    });
  });
});
