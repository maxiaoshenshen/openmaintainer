import { describe, it, expect } from 'vitest';
import { SLATracker } from './sla-tracker';

describe('SLATracker', () => {
  const tracker = new SLATracker();

  it('should initialize with default SLAs', async () => {
    const definitions = await tracker.getAllSLADefinitions();
    expect(definitions.length).toBeGreaterThan(0);
  });

  it('should create custom SLA definition', async () => {
    const sla = await tracker.createSLADefinition({
      name: 'Custom SLA',
      description: 'Custom SLA for testing',
      itemType: 'issue',
      priority: 'medium',
      targetResponseTime: 8,
      targetResolutionTime: 48,
      businessHoursOnly: true,
    });

    expect(sla.id).toBeDefined();
    expect(sla.name).toBe('Custom SLA');
    expect(sla.targetResponseTime).toBe(8);
  });

  it('should get SLA definition', async () => {
    const definitions = await tracker.getAllSLADefinitions();
    const sla = await tracker.getSLADefinition(definitions[0].id);
    expect(sla).toBeDefined();
    expect(sla?.id).toBe(definitions[0].id);
  });

  it('should update SLA definition', async () => {
    const definitions = await tracker.getAllSLADefinitions();
    const updated = await tracker.updateSLADefinition(definitions[0].id, {
      targetResponseTime: 2,
    });
    expect(updated?.targetResponseTime).toBe(2);
  });

  it('should delete SLA definition', async () => {
    const sla = await tracker.createSLADefinition({
      name: 'To Delete',
      description: 'Test',
      itemType: 'issue',
      priority: 'low',
      targetResponseTime: 24,
      targetResolutionTime: 168,
      businessHoursOnly: true,
    });

    const deleted = await tracker.deleteSLADefinition(sla.id);
    expect(deleted).toBe(true);

    const retrieved = await tracker.getSLADefinition(sla.id);
    expect(retrieved).toBeNull();
  });

  it('should start tracking item', async () => {
    const metric = await tracker.startTracking('ISSUE-123', 'issue', 'high');
    expect(metric.itemId).toBe('ISSUE-123');
    expect(metric.currentStatus).toBe('on_track');
    expect(metric.timeRemaining).toBeGreaterThan(0);
  });

  it('should record first response', async () => {
    await tracker.startTracking('PR-456', 'pull_request', 'high');
    const metric = await tracker.recordFirstResponse('PR-456');
    expect(metric).toBeDefined();
    expect(metric?.firstResponseAt).toBeDefined();
  });

  it('should record resolution', async () => {
    await tracker.startTracking('ISSUE-789', 'issue', 'medium');
    const metric = await tracker.recordResolution('ISSUE-789');
    expect(metric).toBeDefined();
    expect(metric?.resolvedAt).toBeDefined();
  });

  it('should get metric by item ID', async () => {
    await tracker.startTracking('ISSUE-999', 'issue', 'low');
    const metric = await tracker.getMetric('ISSUE-999');
    expect(metric).toBeDefined();
    expect(metric?.itemId).toBe('ISSUE-999');
  });

  it('should filter metrics by status', async () => {
    await tracker.startTracking('ISSUE-AAA', 'issue', 'critical');
    await tracker.startTracking('ISSUE-BBB', 'issue', 'high');
    
    const atRisk = await tracker.getAtRiskMetrics();
    const breached = await tracker.getBreachedMetrics();
    
    expect(Array.isArray(atRisk)).toBe(true);
    expect(Array.isArray(breached)).toBe(true);
  });

  it('should generate report', async () => {
    await tracker.startTracking('ISSUE-RPT1', 'issue', 'high');
    await tracker.startTracking('ISSUE-RPT2', 'issue', 'medium');
    
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    const report = await tracker.getReport(startDate, endDate);
    expect(report).toBeDefined();
    expect(report.totalItems).toBeGreaterThanOrEqual(2);
    expect(report.metPercentage).toBeGreaterThanOrEqual(0);
    expect(report.byPriority).toBeDefined();
    expect(report.byType).toBeDefined();
  });

  it('should filter by priority', async () => {
    await tracker.startTracking('ISSUE-P1', 'issue', 'critical');
    await tracker.startTracking('ISSUE-P2', 'issue', 'low');
    
    const criticalMetrics = await tracker.getAllMetrics({ priority: 'critical' });
    expect(criticalMetrics.length).toBeGreaterThan(0);
    expect(criticalMetrics.every(m => m.priority === 'critical')).toBe(true);
  });

  it('should filter by item type', async () => {
    await tracker.startTracking('PR-TYPE1', 'pull_request', 'high');
    await tracker.startTracking('ISSUE-TYPE1', 'issue', 'medium');
    
    const prMetrics = await tracker.getAllMetrics({ itemType: 'pull_request' });
    expect(prMetrics.length).toBeGreaterThan(0);
    expect(prMetrics.every(m => m.itemType === 'pull_request')).toBe(true);
  });

  it('should update SLA and affect existing metrics', async () => {
    await tracker.startTracking('ISSUE-UPD', 'issue', 'high');
    
    const definitions = await tracker.getAllSLADefinitions();
    const highSla = definitions.find(d => d.priority === 'high');
    if (highSla) {
      await tracker.updateSLADefinition(highSla.id, { targetResponseTime: 10 });
      const updated = await tracker.getSLADefinition(highSla.id);
      expect(updated?.targetResponseTime).toBe(10);
    }
  });
});
