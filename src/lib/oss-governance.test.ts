import { describe, it, expect } from 'vitest';
import { createGovernanceFramework } from './oss-governance';

describe('Governance Framework', () => {
  it('creates governance framework instance', () => {
    const framework = createGovernanceFramework();
    expect(framework).toBeDefined();
  });

  it('has default policies', () => {
    const framework = createGovernanceFramework();
    const policies = framework.getPolicies();
    expect(policies.length).toBeGreaterThan(0);
  });

  it('gets policies by area', () => {
    const framework = createGovernanceFramework();
    const contribPolicies = framework.getPolicies('contribution');
    expect(contribPolicies.length).toBeGreaterThan(0);
  });

  it('adds custom policy', () => {
    const framework = createGovernanceFramework();
    const policy = framework.addPolicy({
      area: 'communication',
      title: 'Community Guidelines',
      description: 'Guidelines for community interaction',
      rules: ['Be respectful', 'No spam'],
      exceptions: [],
      lastReviewed: new Date(),
      nextReview: new Date(),
      status: 'draft',
      owner: 'community',
    });
    expect(policy.id).toBeDefined();
  });

  it('has default roles', () => {
    const framework = createGovernanceFramework();
    const roles = framework.getRoles();
    expect(roles.length).toBeGreaterThan(0);
  });

  it('records decisions', () => {
    const framework = createGovernanceFramework();
    const decision = framework.recordDecision({
      title: 'Switch to monorepo',
      context: 'Need better code sharing',
      decision: 'Yes, we will switch',
      rationale: 'Better for collaboration',
      participants: ['maintainer1', 'maintainer2'],
      date: new Date(),
      status: 'accepted',
      relatedDecisions: [],
    });
    expect(decision.id).toBeDefined();
  });

  it('gets compliance report', () => {
    const framework = createGovernanceFramework();
    const report = framework.getComplianceReport();
    expect(report.totalPolicies).toBeGreaterThan(0);
    expect(report.activePolicies).toBeGreaterThan(0);
  });

  it('exports governance document', () => {
    const framework = createGovernanceFramework();
    const doc = framework.exportGovernanceDocument();
    expect(doc).toContain('Governance');
    expect(doc).toContain('Roles');
    expect(doc).toContain('Policies');
  });
});
