import { describe, it, expect } from 'vitest';
import { generateContributingGuide, generateIssueTemplate, generatePRTemplate } from './contributing-generator';

describe('Contributing Generator', () => {
  const mockRepo = {
    name: 'test-repo',
    owner: 'test-owner',
    fullName: 'test-owner/test-repo',
  };

  it('generates contributing guide', () => {
    const guide = generateContributingGuide({
      repository: mockRepo as any,
      includeCodeOfConduct: true,
      includePRTemplate: true,
      includeIssueTemplate: true,
      includeTestGuide: true,
      includeStyleGuide: true,
      communicationChannels: ['GitHub Issues', 'Discord'],
    });

    expect(guide.content).toContain('test-owner/test-repo');
    expect(guide.sections).toContain('Code of Conduct');
    expect(guide.sections).toContain('Getting Started');
    expect(guide.sections).toContain('Development Setup');
    expect(guide.estimatedReadTime).toBeGreaterThan(0);
  });

  it('generates issue template', () => {
    const template = generateIssueTemplate({ repository: 'test/repo' });
    expect(template).toContain('Bug Report');
    expect(template).toContain('Steps to Reproduce');
  });

  it('generates PR template', () => {
    const template = generatePRTemplate({ repository: 'test/repo' });
    expect(template).toContain('Description');
    expect(template).toContain('Type of Change');
    expect(template).toContain('Checklist');
  });

  it('calculates read time', () => {
    const guide = generateContributingGuide({
      repository: mockRepo as any,
      includeCodeOfConduct: false,
      includePRTemplate: false,
      includeIssueTemplate: false,
      includeTestGuide: false,
      includeStyleGuide: false,
      communicationChannels: [],
    });

    expect(guide.estimatedReadTime).toBeGreaterThan(0);
    expect(guide.estimatedReadTime).toBeLessThan(60);
  });
});
