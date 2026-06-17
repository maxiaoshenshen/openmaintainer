import { describe, it, expect } from 'vitest';
import { ReadmeGenerator, ReadmeConfig } from './readme-generator';

describe('ReadmeGenerator', () => {
  const generator = new ReadmeGenerator();

  const mockConfig: ReadmeConfig = {
    repoName: 'awesome-project',
    description: 'An awesome project for testing',
    language: '5.0',
    includeBadges: true,
    includeInstall: true,
    includeUsage: true,
    includeContributing: true,
    includeLicense: true,
    includeCodeOfConduct: false,
  };

  it('should generate README with title', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('# awesome-project');
  });

  it('should include description', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('An awesome project for testing');
  });

  it('should include badges section', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('![License]');
  });

  it('should include installation section', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('## Installation');
    expect(readme).toContain('npm install');
  });

  it('should include usage section', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('## Usage');
  });

  it('should include contributing section', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('## Contributing');
  });

  it('should include license section', async () => {
    const readme = await generator.generateReadme(mockConfig);
    expect(readme).toContain('## License');
  });

  it('should add sections', async () => {
    const section = await generator.addSection({
      title: 'Custom Section',
      content: 'Custom content here',
      order: 1,
      optional: true,
    });
    expect(section.id).toBeDefined();
    expect(section.title).toBe('Custom Section');
  });

  it('should remove sections', async () => {
    const section = await generator.addSection({
      title: 'To Remove',
      content: 'Will be removed',
      order: 1,
      optional: true,
    });

    const removed = await generator.removeSection(section.id);
    expect(removed).toBe(true);
  });

  it('should handle non-existent section removal', async () => {
    const removed = await generator.removeSection('nonexistent');
    expect(removed).toBe(false);
  });

  it('should reorder sections', async () => {
    const gen = new ReadmeGenerator();
    const s1 = await gen.addSection({
      title: 'Section 1',
      content: 'First',
      order: 1,
      optional: false,
    });

    const s2 = await gen.addSection({
      title: 'Section 2',
      content: 'Second',
      order: 2,
      optional: false,
    });

    await gen.reorderSections([s2.id, s1.id]);
    const sections = await gen.exportSections();
    expect(sections.length).toBe(2);
  });

  it('should export sections', async () => {
    const gen = new ReadmeGenerator();
    await gen.addSection({
      title: 'Export Test',
      content: 'Testing export',
      order: 1,
      optional: false,
    });

    const sections = await gen.exportSections();
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should handle minimal config', async () => {
    const minimalConfig: ReadmeConfig = {
      repoName: 'minimal',
      description: 'Minimal project',
      includeBadges: false,
      includeInstall: false,
      includeUsage: false,
      includeContributing: false,
      includeLicense: false,
      includeCodeOfConduct: false,
    };

    const readme = await generator.generateReadme(minimalConfig);
    expect(readme).toContain('# minimal');
  });
});
