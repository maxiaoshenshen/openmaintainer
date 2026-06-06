import { describe, it, expect } from 'vitest';
import { createContributorJourney, updateJourneyProgress, generateJourneyReport, getJourneyStages } from './contributor-journey-map';

describe('Contributor Journey Map', () => {
  const sampleProfile = {
    githubUsername: 'test-user',
    joinedAt: new Date('2026-05-01'),
    totalContributions: 0,
    skills: ['TypeScript', 'React'],
    interests: ['Frontend', 'UI/UX'],
    preferredDifficulty: 'beginner' as const,
  };

  it('creates default journey stages', () => {
    const stages = getJourneyStages();
    expect(stages.length).toBe(5);
    expect(stages[0].id).toBe('discovery');
    expect(stages[4].id).toBe('retention');
  });

  it('creates contributor journey with default values', () => {
    const journey = createContributorJourney(sampleProfile);
    expect(journey.profile.githubUsername).toBe('test-user');
    expect(journey.currentStage).toBe('discovery');
    expect(journey.milestones.length).toBe(10);
  });

  it('updates journey progress on first contribution', () => {
    const journey = createContributorJourney(sampleProfile);
    const updated = updateJourneyProgress(journey, {
      milestoneId: 'first-star',
    });
    const completed = updated.milestones.find(m => m.id === 'first-star');
    expect(completed?.status).toBe('completed');
    expect(completed?.achievedAt).toBeDefined();
  });

  it('tracks completed contributions', () => {
    const journey = createContributorJourney(sampleProfile);
    const updated = updateJourneyProgress(journey, {
      contribution: {
        id: '1',
        type: 'pr',
        title: 'Fix bug in parser',
        difficulty: 'beginner',
        mergedAt: new Date(),
        feedback: 'positive' as const,
      },
    });
    expect(updated.completedContributions.length).toBe(1);
  });

  it('advances stage based on milestones', () => {
    let journey = createContributorJourney(sampleProfile);
    journey = updateJourneyProgress(journey, { milestoneId: 'first-star' });
    journey = updateJourneyProgress(journey, { milestoneId: 'fork-clone' });
    journey = updateJourneyProgress(journey, { milestoneId: 'setup-complete' });
    journey = updateJourneyProgress(journey, { milestoneId: 'first-issue' });
    journey = updateJourneyProgress(journey, { milestoneId: 'first-pr' });
    // After 5+ milestones, should advance to first-contribution stage
    expect(['first-contribution', 'integration', 'retention']).toContain(journey.currentStage);
  });

  it('generates journey report', () => {
    const journey = createContributorJourney(sampleProfile);
    const report = generateJourneyReport(journey);
    expect(report).toContain('test-user');
    expect(report).toContain('Total Contributions');
  });
});
