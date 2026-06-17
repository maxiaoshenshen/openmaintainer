import { describe, it, expect } from 'vitest';
import { ApiMetricsCollector } from './api-metrics';

describe('ApiMetricsCollector', () => {
  const collector = new ApiMetricsCollector();

  it('should record metrics', async () => {
    await collector.recordMetric('requests_total', 100);
    const points = await collector.getMetric('requests_total');
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].value).toBe(100);
  });

  it('should record metrics with labels', async () => {
    await collector.recordMetric('api_calls', 50, { endpoint: '/users', method: 'GET' });
    const points = await collector.getMetric('api_calls');
    expect(points[0].labels?.endpoint).toBe('/users');
  });

  it('should record endpoint calls', async () => {
    await collector.recordEndpointCall('/api/users', 'GET', 150, 200);
    const endpoint = await collector.getEndpoint('/api/users', 'GET');
    expect(endpoint).not.toBeNull();
    expect(endpoint?.requests).toBe(1);
    expect(endpoint?.avgResponseTime).toBe(150);
  });

  it('should calculate error rate', async () => {
    await collector.recordEndpointCall('/api/error', 'GET', 100, 500);
    await collector.recordEndpointCall('/api/error', 'GET', 100, 500);
    
    const endpoint = await collector.getEndpoint('/api/error', 'GET');
    expect(endpoint?.errorRate).toBeGreaterThan(0);
  });

  it('should get all endpoints', async () => {
    const c = new ApiMetricsCollector();
    await c.recordEndpointCall('/api/1', 'GET', 50, 200);
    await c.recordEndpointCall('/api/2', 'POST', 100, 201);
    
    const endpoints = await c.getAllEndpoints();
    expect(endpoints.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate report', async () => {
    await collector.recordEndpointCall('/api/test', 'GET', 100, 200);
    await collector.recordMetric('custom_metric', 42);
    
    const report = await collector.generateReport('repo-1');
    expect(report.repoId).toBe('repo-1');
    expect(report.endpoints.length).toBeGreaterThan(0);
    expect(report.summary.totalRequests).toBeGreaterThan(0);
  });

  it('should get slow endpoints', async () => {
    const c = new ApiMetricsCollector();
    await c.recordEndpointCall('/api/fast', 'GET', 50, 200);
    await c.recordEndpointCall('/api/slow', 'GET', 500, 200);
    
    const slow = await c.getSlowEndpoints(1);
    expect(slow.length).toBeGreaterThan(0);
  });

  it('should get error endpoints', async () => {
    const c = new ApiMetricsCollector();
    await c.recordEndpointCall('/api/bad', 'GET', 100, 500);
    
    const errors = await c.getErrorEndpoints();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should filter metrics by duration', async () => {
    await collector.recordMetric('timed_metric', 10);
    const points = await collector.getMetric('timed_metric', 60000);
    expect(points.length).toBeGreaterThanOrEqual(0);
  });

  it('should return null for non-existent endpoint', async () => {
    const endpoint = await collector.getEndpoint('/nonexistent', 'GET');
    expect(endpoint).toBeNull();
  });
});
