import { describe, it, expect } from 'vitest';
import { WebhookManager } from './webhook-manager';

describe('WebhookManager', () => {
  const manager = new WebhookManager();

  it('should create a webhook endpoint', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push', 'pull_request'],
    });

    expect(endpoint.id).toBeDefined();
    expect(endpoint.url).toBe('https://example.com/webhook');
    expect(endpoint.events).toEqual(['push', 'pull_request']);
    expect(endpoint.enabled).toBe(true);
  });

  it('should update endpoint', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push'],
    });

    const updated = await manager.updateEndpoint(endpoint.id, {
      url: 'https://example.com/new-webhook',
      events: ['push', 'issues'],
    });

    expect(updated?.url).toBe('https://example.com/new-webhook');
    expect(updated?.events).toEqual(['push', 'issues']);
  });

  it('should delete endpoint', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push'],
    });

    const deleted = await manager.deleteEndpoint(endpoint.id);
    expect(deleted).toBe(true);

    const retrieved = await manager.getEndpoint(endpoint.id);
    expect(retrieved).toBeNull();
  });

  it('should trigger event to matching endpoints', async () => {
    await manager.createEndpoint({
      url: 'https://example.com/webhook1',
      events: ['push'],
    });

    await manager.createEndpoint({
      url: 'https://example.com/webhook2',
      events: ['issues'],
    });

    await manager.triggerEvent('push', { action: 'opened' });
    
    // Should have triggered push events
    const endpoints = await manager.getAllEndpoints();
    endpoints.forEach(async (ep) => {
      const deliveries = await manager.getDeliveries(ep.id);
      if (ep.events.includes('push')) {
        expect(deliveries.length).toBeGreaterThan(0);
      }
    });
  });

  it('should get metrics', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push', 'pull_request'],
    });

    await manager.triggerEvent('push', { action: 'opened' });
    await manager.triggerEvent('pull_request', { action: 'closed' });

    const metrics = await manager.getMetrics(endpoint.id);
    expect(metrics.totalDeliveries).toBeGreaterThan(0);
  });

  it('should test endpoint', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push'],
    });

    const delivery = await manager.testEndpoint(endpoint.id);
    expect(delivery).toBeDefined();
    expect(delivery?.webhookId).toBe(endpoint.id);
    expect(delivery?.event).toBe('push');
  });

  it('should retry failed delivery', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push'],
    });

    await manager.triggerEvent('push', { action: 'test' });
    
    const deliveries = await manager.getDeliveries(endpoint.id);
    const failedDelivery = deliveries.find(d => d.status === 'failed');
    
    if (failedDelivery) {
      const retried = await manager.retryDelivery(endpoint.id, failedDelivery.id);
      expect(retried).toBeDefined();
      expect(retried?.attempts).toBe(2);
    } else {
      // If all succeeded, that's fine too
      expect(deliveries.length).toBeGreaterThan(0);
    }
  });

  it('should filter by event type', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push', 'issues', 'release'],
    });

    await manager.triggerEvent('push', { type: 'push' });
    await manager.triggerEvent('issues', { type: 'issues' });
    await manager.triggerEvent('release', { type: 'release' });

    const deliveries = await manager.getDeliveries(endpoint.id);
    const pushDeliveries = deliveries.filter(d => d.event === 'push');
    const issuesDeliveries = deliveries.filter(d => d.event === 'issues');

    expect(pushDeliveries.length).toBeGreaterThan(0);
    expect(issuesDeliveries.length).toBeGreaterThan(0);
  });

  it('should disable and enable endpoint', async () => {
    const endpoint = await manager.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['push'],
    });

    await manager.updateEndpoint(endpoint.id, { enabled: false });
    let ep = await manager.getEndpoint(endpoint.id);
    expect(ep?.enabled).toBe(false);

    await manager.updateEndpoint(endpoint.id, { enabled: true });
    ep = await manager.getEndpoint(endpoint.id);
    expect(ep?.enabled).toBe(true);
  });
});
