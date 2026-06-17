import { describe, it, expect } from 'vitest';
import { LicenseAnalyzer } from './license-analyzer';

describe('LicenseAnalyzer', () => {
  const analyzer = new LicenseAnalyzer();

  it('should analyze dependencies with licenses', async () => {
    const deps = [
      { name: 'express', version: '4.18.0', license: 'MIT' },
      { name: 'lodash', version: '4.17.21', license: 'MIT' },
      { name: 'webpack', version: '5.0.0', license: 'MIT' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-1', deps);
    expect(analysis.dependencies.length).toBe(3);
    expect(analysis.risks.low).toBe(3);
  });

  it('should identify license risks', async () => {
    const deps = [
      { name: 'gpl-dep', version: '1.0.0', license: 'GPL-3.0' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-2', deps);
    expect(analysis.risks.medium).toBe(1);
  });

  it('should handle unknown licenses', async () => {
    const deps = [
      { name: 'unknown-dep', version: '1.0.0', license: 'UNKNOWN' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-3', deps);
    expect(analysis.dependencies[0].license.spdxId).toBe('UNKNOWN');
    expect(analysis.dependencies[0].license.risk).toBe('high');
  });

  it('should track incompatible dependencies', async () => {
    const deps = [
      { name: 'critical-dep', version: '1.0.0', license: 'UNKNOWN' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-4', deps);
    expect(analysis.incompatible.length).toBe(1);
  });

  it('should generate recommendations', async () => {
    const deps = [
      { name: 'test-dep', version: '1.0.0', license: 'MIT' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-5', deps);
    expect(Array.isArray(analysis.recommendations)).toBe(true);
  });

  it('should get stored analysis', async () => {
    const deps = [{ name: 'test', version: '1.0.0', license: 'MIT' }];
    await analyzer.analyzeDependencies('repo-6', deps);

    const analysis = await analyzer.getAnalysis('repo-6');
    expect(analysis).not.toBeNull();
    expect(analysis?.dependencies.length).toBe(1);
  });

  it('should return null for non-existent analysis', async () => {
    const analysis = await analyzer.getAnalysis('nonexistent');
    expect(analysis).toBeNull();
  });

  it('should check compatibility', async () => {
    const deps = [{ name: 'test', version: '1.0.0', license: 'MIT' }];
    await analyzer.analyzeDependencies('repo-7', deps);

    const compatible = await analyzer.checkCompatibility('repo-7', 'permissive');
    expect(typeof compatible).toBe('boolean');
  });

  it('should identify transitive dependencies', async () => {
    const deps = [
      { name: 'parent', version: '1.0.0', license: 'MIT' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-8', deps);
    expect(analysis.dependencies[0].transitive).toBe(false);
  });

  it('should handle dependencies without license field', async () => {
    const deps = [
      { name: 'no-license', version: '1.0.0' },
    ];

    const analysis = await analyzer.analyzeDependencies('repo-9', deps);
    expect(analysis.dependencies[0].license.spdxId).toBe('UNKNOWN');
  });
});
