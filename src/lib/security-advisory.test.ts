import { describe, it, expect } from 'vitest';
import { SecurityAdvisoryManager, AdvisorySeverity } from './security-advisory';

describe('SecurityAdvisoryManager', () => {
  const manager = new SecurityAdvisoryManager();

  it('should create advisory', async () => {
    const advisory = await manager.createAdvisory({
      title: 'SQL Injection Vulnerability',
      description: 'SQL injection in user input',
      severity: 'critical',
      affectedRanges: ['>=1.0.0 <2.0.0'],
    });

    expect(advisory.id).toBeDefined();
    expect(advisory.title).toBe('SQL Injection Vulnerability');
    expect(advisory.status).toBe('open');
  });

  it('should update advisory status', async () => {
    const advisory = await manager.createAdvisory({
      title: 'XSS Vulnerability',
      description: 'Cross-site scripting issue',
      severity: 'high',
      affectedRanges: ['>=1.0.0'],
    });

    const updated = await manager.updateStatus(advisory.id, 'resolved');
    expect(updated?.status).toBe('resolved');
    expect(updated?.resolvedAt).toBeDefined();
  });

  it('should add references', async () => {
    const advisory = await manager.createAdvisory({
      title: 'Test Advisory',
      description: 'Test',
      severity: 'low',
      affectedRanges: ['>=1.0.0'],
    });

    await manager.addReference(advisory.id, 'https://example.com/advisory');
    const updated = await manager.getAdvisory(advisory.id);
    expect(updated?.references.length).toBe(1);
  });

  it('should set patched versions', async () => {
    const advisory = await manager.createAdvisory({
      title: 'Patch Test',
      description: 'Testing patches',
      severity: 'medium',
      affectedRanges: ['>=1.0.0 <2.0.0'],
    });

    await manager.setPatchedVersions(advisory.id, ['2.0.0', '2.0.1']);
    const updated = await manager.getAdvisory(advisory.id);
    expect(updated?.patchedVersions?.length).toBe(2);
  });

  it('should get advisory by id', async () => {
    const advisory = await manager.createAdvisory({
      title: 'Get Test',
      description: 'Testing get',
      severity: 'low',
      affectedRanges: ['>=1.0.0'],
    });

    const found = await manager.getAdvisory(advisory.id);
    expect(found?.id).toBe(advisory.id);
  });

  it('should filter by severity', async () => {
    await manager.createAdvisory({
      title: 'Critical Issue',
      description: 'Test',
      severity: 'critical',
      affectedRanges: ['>=1.0.0'],
    });

    const critical = await manager.getAllAdvisories({ severity: 'critical' });
    expect(critical.length).toBeGreaterThan(0);
  });

  it('should filter by status', async () => {
    const advisory = await manager.createAdvisory({
      title: 'Open Issue',
      description: 'Test',
      severity: 'high',
      affectedRanges: ['>=1.0.0'],
    });

    await manager.updateStatus(advisory.id, 'mitigated');
    const mitigated = await manager.getAllAdvisories({ status: 'mitigated' });
    expect(mitigated.length).toBe(1);
  });

  it('should get metrics', async () => {
    await manager.createAdvisory({
      title: 'Metrics Test',
      description: 'Test',
      severity: 'medium',
      affectedRanges: ['>=1.0.0'],
    });

    const metrics = await manager.getMetrics();
    expect(metrics.total).toBeGreaterThan(0);
    expect(metrics.bySeverity).toBeDefined();
    expect(metrics.byStatus).toBeDefined();
  });

  it('should check version affected', async () => {
    const advisory = await manager.createAdvisory({
      title: 'Version Test',
      description: 'Test',
      severity: 'high',
      affectedRanges: ['>=1.0.0 <2.0.0'],
    });

    const affected = await manager.checkVersionAffected(advisory.id, '1.5.0');
    expect(affected).toBe(true);
  });

  it('should return false for unaffected version', async () => {
    const advisory = await manager.createAdvisory({
      title: 'Unaffected Test',
      description: 'Test',
      severity: 'high',
      affectedRanges: ['>=1.0.0 <2.0.0'],
    });

    const affected = await manager.checkVersionAffected(advisory.id, '2.0.0');
    expect(affected).toBe(false);
  });
});
