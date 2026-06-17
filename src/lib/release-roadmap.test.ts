import { describe, it, expect } from 'vitest';
import { ReleaseRoadmapPlanner, releaseRoadmapPlanner } from './release-roadmap';

describe('ReleaseRoadmapPlanner', () => {
  const planner = new ReleaseRoadmapPlanner();

  describe('createMilestone', () => {
    it('should create a new milestone', () => {
      const milestone = planner.createMilestone('v1.0 Release', 'First major release', new Date('2026-06-30'));
      
      expect(milestone).toHaveProperty('id');
      expect(milestone).toHaveProperty('title', 'v1.0 Release');
      expect(milestone).toHaveProperty('status', 'planned');
      expect(milestone).toHaveProperty('progress', 0);
    });
  });

  describe('updateMilestoneProgress', () => {
    it('should update milestone progress', () => {
      const milestone = planner.createMilestone('Test Milestone', 'Description', new Date());
      milestone.issues = [
        { id: '1', title: 'Issue 1', completed: true },
        { id: '2', title: 'Issue 2', completed: false },
        { id: '3', title: 'Issue 3', completed: true }
      ];
      
      planner.updateMilestoneProgress(milestone.id);
      
      expect(milestone.progress).toBe(67);
      expect(milestone.status).toBe('in-progress');
    });

    it('should mark milestone as completed when all issues done', () => {
      const milestone = planner.createMilestone('Complete Milestone', 'Desc', new Date());
      milestone.issues = [
        { id: '1', title: 'Issue 1', completed: true },
        { id: '2', title: 'Issue 2', completed: true }
      ];
      
      planner.updateMilestoneProgress(milestone.id);
      
      expect(milestone.progress).toBe(100);
      expect(milestone.status).toBe('completed');
    });
  });

  describe('addFeatureToRoadmap', () => {
    it('should add feature to roadmap', () => {
      const roadmap = planner.addFeatureToRoadmap('v2.0.0', {
        title: 'New Feature',
        description: 'Description',
        priority: 'should-have',
        effort: 'medium',
        labels: ['enhancement']
      });
      
      expect(roadmap.version).toBe('v2.0.0');
      expect(roadmap.features.length).toBe(1);
      expect(roadmap.features[0].title).toBe('New Feature');
    });
  });

  describe('generateTimeline', () => {
    it('should generate release timeline', () => {
      const timeline = planner.generateTimeline('v1.0.0', 3);
      
      expect(Array.isArray(timeline)).toBe(true);
      expect(timeline.length).toBe(4);
      timeline.forEach(item => {
        expect(item).toHaveProperty('version');
        expect(item).toHaveProperty('plannedDate');
        expect(item).toHaveProperty('remainingDays');
        expect(item).toHaveProperty('completionPercentage');
      });
    });
  });

  describe('identifyBlockers', () => {
    it('should identify blockers by severity', () => {
      planner.createMilestone('Urgent Milestone', 'Desc', new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
      planner.getAllMilestones()[0].blockers = ['Blocker 1'];
      
      const blockers = planner.identifyBlockers();
      expect(Array.isArray(blockers)).toBe(true);
    });
  });

  describe('calculateReleaseReadiness', () => {
    it('should calculate release readiness', () => {
      planner.addFeatureToRoadmap('v3.0.0', {
        title: 'Critical Feature',
        description: 'Must have',
        priority: 'must-have',
        effort: 'large',
        labels: []
      });
      
      const readiness = planner.calculateReleaseReadiness('v3.0.0');
      
      expect(readiness).toHaveProperty('readiness');
      expect(readiness).toHaveProperty('recommendation');
      expect(readiness).toHaveProperty('criticalFeatures');
    });
  });

  describe('getAllMilestones', () => {
    it('should return all milestones', () => {
      planner.createMilestone('Milestone 1', 'Desc 1', new Date());
      planner.createMilestone('Milestone 2', 'Desc 2', new Date());
      
      const milestones = planner.getAllMilestones();
      expect(milestones.length).toBeGreaterThanOrEqual(2);
    });
  });
});
