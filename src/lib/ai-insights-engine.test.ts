import { describe, it, expect } from 'vitest';
import { generateInsights, summarizeInsights } from './ai-insights-engine';

describe('AI Insights Engine', () => {
  const baseContext = {
    repository: {
      name: 'test-repo',
      stars: 1000,
      forks: 100,
      openIssues: 50,
      openPRs: 10,
      lastReleaseAt: new Date('2026-05-01'),
    },
    contributors: {
      total: 20,
      active: 15,
      newThisMonth: 3,
      churned: 1,
    },
    activity: {
      issuesPerWeek: 5,
      prsPerWeek: 3,
      avgResponseTime: 24,
      reviewTime: 12,
    },
    health: {
      issueResolutionRate: 0.7,
      prMergeRate: 0.8,
      communityEngagement: 0.6,
    },
  };

  it('generates health insights for low resolution rate', () => {
    const context = {
      ...baseContext,
      health: { ...baseContext.health, issueResolutionRate: 0.2 },
    };
    const insights = generateInsights(context);
    const healthInsight = insights.find(i => i.category === 'health');
    expect(healthInsight).toBeDefined();
    expect(healthInsight?.impact).toBe('critical');
  });

  it('generates growth insights for positive contributor growth', () => {
    const context = {
      ...baseContext,
      contributors: { ...baseContext.contributors, newThisMonth: 5, churned: 1 },
    };
    const insights = generateInsights(context);
    const growthInsight = insights.find(i => i.category === 'growth');
    expect(growthInsight).toBeDefined();
    expect(growthInsight?.title).toContain('Growth');
  });

  it('generates risk insights for contributor churn', () => {
    const context = {
      ...baseContext,
      contributors: { ...baseContext.contributors, newThisMonth: 1, churned: 5 },
    };
    const insights = generateInsights(context);
    const riskInsight = insights.find(i => i.category === 'risk');
    expect(riskInsight).toBeDefined();
    expect(riskInsight?.title).toContain('Churn');
  });

  it('generates efficiency insights for slow response time', () => {
    const context = {
      ...baseContext,
      activity: { ...baseContext.activity, avgResponseTime: 100 },
    };
    const insights = generateInsights(context);
    const efficiencyInsight = insights.find(i => i.category === 'efficiency');
    expect(efficiencyInsight).toBeDefined();
    expect(efficiencyInsight?.title).toContain('Response Time');
  });

  it('generates opportunity insights for stale release', () => {
    const context = {
      ...baseContext,
      repository: { ...baseContext.repository, lastReleaseAt: new Date('2026-01-01') },
    };
    const insights = generateInsights(context);
    const opportunityInsight = insights.find(i => i.category === 'opportunity');
    expect(opportunityInsight).toBeDefined();
    expect(opportunityInsight?.title).toContain('Stale Release');
  });

  it('summarizes insights correctly', () => {
    const insights = generateInsights(baseContext);
    const summary = summarizeInsights(insights);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('sorts insights by impact', () => {
    const context = {
      ...baseContext,
      health: { ...baseContext.health, issueResolutionRate: 0.2 },
      contributors: { ...baseContext.contributors, newThisMonth: 1, churned: 5 },
      activity: { ...baseContext.activity, avgResponseTime: 200 },
    };
    const insights = generateInsights(context);
    const firstInsight = insights[0];
    expect(firstInsight?.impact).toBe('critical');
  });
});
