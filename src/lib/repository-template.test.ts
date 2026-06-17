import { describe, it, expect } from 'vitest';
import { RepositoryTemplateManager } from './repository-template';

describe('RepositoryTemplateManager', () => {
  const manager = new RepositoryTemplateManager();

  it('should create a template', async () => {
    const template = await manager.createTemplate({
      name: 'My Awesome Project',
      description: 'An awesome project',
      language: 'typescript',
      framework: 'node',
      license: 'MIT',
      includeTests: true,
      includeCI: true,
      includeDocker: false,
      includeDocs: true,
      includeESLint: true,
      includePrettier: true,
      includeGitHooks: false,
      includeCHANGELOG: true,
      includeContributing: true,
      includeBadges: true,
    });

    expect(template.id).toBeDefined();
    expect(template.config.name).toBe('My Awesome Project');
    expect(template.files.length).toBeGreaterThan(0);
  });

  it('should generate files for TypeScript project', async () => {
    const template = await manager.createTemplate({
      name: 'TS Project',
      description: 'TypeScript project',
      language: 'typescript',
      license: 'MIT',
      includeTests: true,
      includeCI: true,
      includeDocker: true,
      includeDocs: false,
      includeESLint: true,
      includePrettier: true,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    const paths = template.files.map(f => f.path);
    expect(paths).toContain('README.md');
    expect(paths).toContain('package.json');
    expect(paths).toContain('tsconfig.json');
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/index.test.ts');
    expect(paths).toContain('.gitignore');
    expect(paths).toContain('LICENSE');
    expect(paths).toContain('.github/workflows/ci.yml');
    expect(paths).toContain('Dockerfile');
  });

  it('should generate files for Python project', async () => {
    const template = await manager.createTemplate({
      name: 'Python Project',
      description: 'Python project',
      language: 'python',
      license: 'Apache-2.0',
      includeTests: true,
      includeCI: true,
      includeDocker: true,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    const paths = template.files.map(f => f.path);
    expect(paths).toContain('README.md');
    expect(paths).toContain('src/index.py');
    expect(paths).toContain('src/index.test.py');
  });

  it('should generate files for Rust project', async () => {
    const template = await manager.createTemplate({
      name: 'Rust Project',
      description: 'Rust project',
      language: 'rust',
      license: 'MIT',
      includeTests: true,
      includeCI: true,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    const paths = template.files.map(f => f.path);
    expect(paths).toContain('README.md');
    expect(paths).toContain('src/index.rs');
  });

  it('should include contributing guide when enabled', async () => {
    const template = await manager.createTemplate({
      name: 'Test Project',
      description: 'Test',
      language: 'typescript',
      license: 'MIT',
      includeTests: false,
      includeCI: false,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: true,
      includeBadges: false,
    });

    const paths = template.files.map(f => f.path);
    expect(paths).toContain('CONTRIBUTING.md');
  });

  it('should include CHANGELOG when enabled', async () => {
    const template = await manager.createTemplate({
      name: 'Test Project',
      description: 'Test',
      language: 'typescript',
      license: 'MIT',
      includeTests: false,
      includeCI: false,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: true,
      includeContributing: false,
      includeBadges: false,
    });

    const paths = template.files.map(f => f.path);
    expect(paths).toContain('CHANGELOG.md');
  });

  it('should export and import template', async () => {
    const original = await manager.createTemplate({
      name: 'Original Template',
      description: 'Original',
      language: 'typescript',
      license: 'MIT',
      includeTests: true,
      includeCI: false,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    const exported = await manager.exportTemplate(original.id);
    const imported = await manager.importTemplate(exported);

    expect(imported.id).toBe(original.id);
    expect(imported.config.name).toBe(original.config.name);
    expect(imported.files.length).toBe(original.files.length);
  });

  it('should get all templates', async () => {
    await manager.createTemplate({
      name: 'Template 1',
      description: 'Test',
      language: 'typescript',
      license: 'MIT',
      includeTests: false,
      includeCI: false,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    await manager.createTemplate({
      name: 'Template 2',
      description: 'Test',
      language: 'python',
      license: 'Apache-2.0',
      includeTests: false,
      includeCI: false,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    const templates = await manager.getAllTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(2);
  });

  it('should delete template', async () => {
    const template = await manager.createTemplate({
      name: 'To Delete',
      description: 'Test',
      language: 'typescript',
      license: 'MIT',
      includeTests: false,
      includeCI: false,
      includeDocker: false,
      includeDocs: false,
      includeESLint: false,
      includePrettier: false,
      includeGitHooks: false,
      includeCHANGELOG: false,
      includeContributing: false,
      includeBadges: false,
    });

    const deleted = await manager.deleteTemplate(template.id);
    expect(deleted).toBe(true);

    const retrieved = await manager.getTemplate(template.id);
    expect(retrieved).toBeNull();
  });

  it('should handle different license types', async () => {
    const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'Unlicense'] as const;
    
    for (const license of licenses) {
      const template = await manager.createTemplate({
        name: `License Test - ${license}`,
        description: 'Test',
        language: 'typescript',
        license,
        includeTests: false,
        includeCI: false,
        includeDocker: false,
        includeDocs: false,
        includeESLint: false,
        includePrettier: false,
        includeGitHooks: false,
        includeCHANGELOG: false,
        includeContributing: false,
        includeBadges: false,
      });

      const licenseFile = template.files.find(f => f.path === 'LICENSE');
      expect(licenseFile?.content.length).toBeGreaterThan(0);
    }
  });
});
