import { describe, it, expect } from 'vitest';
import { IncidentResponse, IncidentSeverity, IncidentStatus } from './incident-response';

describe('IncidentResponse', () => {
  const responder = new IncidentResponse();

  it('should create an incident', async () => {
    const incident = await responder.createIncident({
      title: 'API Down',
      description: 'API endpoint not responding',
      severity: 'critical',
      affectedComponents: ['api-gateway'],
    });

    expect(incident.id).toBeDefined();
    expect(incident.title).toBe('API Down');
    expect(incident.severity).toBe('critical');
    expect(incident.status).toBe('detected');
    expect(incident.timeline.length).toBeGreaterThan(0);
  });

  it('should update incident status', async () => {
    const incident = await responder.createIncident({
      title: 'Memory Leak',
      description: 'Memory usage increasing',
      severity: 'high',
      affectedComponents: ['worker'],
    });

    const updated = await responder.updateStatus(incident.id, 'investigating', 'admin');
    expect(updated?.status).toBe('investigating');
    expect(updated?.timeline.length).toBe(2);
  });

  it('should assign incident', async () => {
    const incident = await responder.createIncident({
      title: 'Slow Response',
      description: 'Response times degrading',
      severity: 'medium',
      affectedComponents: ['api'],
    });

    const assigned = await responder.assignIncident(incident.id, 'developer-1');
    expect(assigned?.assignee).toBe('developer-1');
  });

  it('should get incident by id', async () => {
    const incident = await responder.createIncident({
      title: 'Test Incident',
      description: 'Testing',
      severity: 'low',
      affectedComponents: ['test'],
    });

    const found = await responder.getIncident(incident.id);
    expect(found?.id).toBe(incident.id);
  });

  it('should filter incidents by status', async () => {
    await responder.createIncident({
      title: 'Incident 1',
      description: 'Test',
      severity: 'low',
      affectedComponents: ['test'],
    });

    const criticalIncident = await responder.createIncident({
      title: 'Incident 2',
      description: 'Test',
      severity: 'critical',
      affectedComponents: ['test'],
    });

    await responder.updateStatus(criticalIncident.id, 'investigating', 'admin');

    const active = await responder.getAllIncidents({ status: 'investigating' });
    expect(active.length).toBeGreaterThan(0);
    expect(active[0].status).toBe('investigating');
  });

  it('should get incident metrics', async () => {
    await responder.createIncident({
      title: 'Metric Test',
      description: 'Testing metrics',
      severity: 'medium',
      affectedComponents: ['test'],
    });

    const metrics = await responder.getMetrics();
    expect(metrics.totalIncidents).toBeGreaterThan(0);
    expect(metrics.incidentsBySeverity).toBeDefined();
    expect(metrics.incidentsByStatus).toBeDefined();
  });

  it('should add timeline events', async () => {
    const incident = await responder.createIncident({
      title: 'Timeline Test',
      description: 'Testing timeline',
      severity: 'low',
      affectedComponents: ['test'],
    });

    await responder.addTimelineEvent(incident.id, 'Manual check', 'user', 'Checked logs');
    const updated = await responder.getIncident(incident.id);
    expect(updated?.timeline.length).toBe(2);
  });

  it('should register notification callback', async () => {
    let called = false;
    const responder2 = new IncidentResponse();
    responder2.onNotification(() => { called = true; });

    await responder2.createIncident({
      title: 'Notification Test',
      description: 'Testing notifications',
      severity: 'low',
      affectedComponents: ['test'],
    });

    expect(called).toBe(true);
  });

  it('should set resolved timestamp when resolved', async () => {
    const incident = await responder.createIncident({
      title: 'Resolve Test',
      description: 'Testing resolution',
      severity: 'low',
      affectedComponents: ['test'],
    });

    await responder.updateStatus(incident.id, 'resolved', 'admin');
    const updated = await responder.getIncident(incident.id);
    expect(updated?.resolvedAt).toBeDefined();
  });

  it('should handle missing incident', async () => {
    const result = await responder.updateStatus('nonexistent', 'resolved', 'admin');
    expect(result).toBeNull();
  });
});
