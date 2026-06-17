import { describe, it, expect, beforeEach } from 'vitest';
import { APIGateway } from './api-gateway';

describe('APIGateway', () => {
  let gateway: APIGateway;

  beforeEach(() => {
    gateway = new APIGateway({
      globalRateLimit: { windowMs: 60000, maxRequests: 100 }
    });
  });

  describe('routes', () => {
    it('should add route', () => {
      gateway.addRoute({
        path: '/api/users',
        method: 'GET',
        handler: 'getUsers',
        authRequired: false
      });

      const route = gateway.getRoute('GET', '/api/users');
      expect(route?.handler).toBe('getUsers');
    });

    it('should list routes', () => {
      gateway.addRoute({ path: '/a', method: 'GET', handler: 'a', authRequired: false });
      gateway.addRoute({ path: '/b', method: 'POST', handler: 'b', authRequired: false });

      const routes = gateway.listRoutes();
      expect(routes).toHaveLength(2);
    });

    it('should remove route', () => {
      gateway.addRoute({ path: '/remove', method: 'GET', handler: 'r', authRequired: false });
      expect(gateway.removeRoute('GET', '/remove')).toBe(true);
      expect(gateway.getRoute('GET', '/remove')).toBeUndefined();
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', () => {
      const ctx = {
        id: 'req-1', path: '/test', method: 'GET', ip: '127.0.0.1',
        headers: {}, timestamp: new Date()
      };

      const result = gateway.checkRateLimit(ctx);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should block requests over limit', () => {
      const localGateway = new APIGateway({
        globalRateLimit: { windowMs: 60000, maxRequests: 2 }
      });

      for (let i = 0; i < 3; i++) {
        const result = localGateway.checkRateLimit({
          id: `req-${i}`, path: '/test', method: 'GET', ip: '192.168.1.1',
          headers: {}, timestamp: new Date()
        });
        if (i < 2) expect(result.allowed).toBe(true);
        else expect(result.allowed).toBe(false);
      }
    });
  });

  describe('authentication', () => {
    it('should generate token', () => {
      const token = gateway.generateToken('user-1', ['read', 'write'], 3600000);
      expect(token.token).toContain('tok_');
      expect(token.userId).toBe('user-1');
      expect(token.scopes).toEqual(['read', 'write']);
    });

    it('should validate token', () => {
      const token = gateway.generateToken('user-1', ['read'], 3600000);
      const validated = gateway.validateToken(token.token);
      expect(validated?.userId).toBe('user-1');
    });

    it('should reject expired token', () => {
      const token = gateway.generateToken('user-1', ['read'], -1000);
      const validated = gateway.validateToken(token.token);
      expect(validated).toBeNull();
    });

    it('should revoke token', () => {
      const token = gateway.generateToken('user-1', ['read'], 3600000);
      expect(gateway.revokeToken(token.token)).toBe(true);
      expect(gateway.validateToken(token.token)).toBeNull();
    });

    it('should revoke all user tokens', () => {
      gateway.generateToken('user-1', ['read'], 3600000);
      gateway.generateToken('user-1', ['write'], 3600000);
      expect(gateway.revokeAllUserTokens('user-1')).toBe(2);
    });
  });

  describe('middlewares', () => {
    it('should add middleware', () => {
      gateway.addMiddleware({
        name: 'auth-check',
        order: 1,
        handler: () => true
      });

      gateway.addMiddleware({
        name: 'log',
        order: 0,
        handler: () => true
      });

      gateway.addMiddleware({
        name: 'transform',
        order: 2,
        handler: () => true
      });

      const stats = gateway.getStatistics();
      expect(gateway.getStatistics().activeTokens).toBeDefined();
    });

    it('should execute middlewares', async () => {
      let order: string[] = [];
      gateway.addMiddleware({ name: 'first', order: 0, handler: () => { order.push('first'); return true; } });
      gateway.addMiddleware({ name: 'second', order: 1, handler: () => { order.push('second'); return true; } });

      const result = await gateway.executeMiddlewares({
        id: 'test', path: '/', method: 'GET', ip: '127.0.0.1', headers: {}, timestamp: new Date()
      });

      expect(result.success).toBe(true);
      expect(order).toEqual(['first', 'second']);
    });

    it('should reject on middleware failure', async () => {
      gateway.addMiddleware({ name: 'fail', order: 0, handler: () => false });

      const result = await gateway.executeMiddlewares({
        id: 'test', path: '/', method: 'GET', ip: '127.0.0.1', headers: {}, timestamp: new Date()
      });

      expect(result.success).toBe(false);
    });
  });

  describe('request logging', () => {
    it('should log requests', () => {
      gateway.logRequest({
        id: 'req-1', path: '/api/users', method: 'GET', ip: '127.0.0.1',
        userId: 'user-1', headers: {}, timestamp: new Date()
      });

      const logs = gateway.getRequestLog();
      expect(logs).toHaveLength(1);
      expect(logs[0].path).toBe('/api/users');
    });

    it('should filter logs', () => {
      gateway.logRequest({ id: '1', path: '/a', method: 'GET', ip: '1', headers: {}, timestamp: new Date() });
      gateway.logRequest({ id: '2', path: '/b', method: 'GET', ip: '2', headers: {}, timestamp: new Date() });

      const logs = gateway.getRequestLog({ path: '/a' });
      expect(logs).toHaveLength(1);
    });

    it('should limit logs', () => {
      for (let i = 0; i < 10; i++) {
        gateway.logRequest({ id: String(i), path: '/test', method: 'GET', ip: String(i), headers: {}, timestamp: new Date() });
      }

      const logs = gateway.getRequestLog({ limit: 5 });
      expect(logs).toHaveLength(5);
    });
  });

  describe('statistics', () => {
    it('should return correct statistics', () => {
      gateway.logRequest({ id: '1', path: '/api/a', method: 'GET', ip: '1', headers: {}, timestamp: new Date() });
      gateway.logRequest({ id: '2', path: '/api/b', method: 'POST', ip: '2', headers: {}, timestamp: new Date() });

      const stats = gateway.getStatistics();
      expect(stats.totalRequests).toBe(2);
      expect(stats.requestsByPath['/api/a']).toBe(1);
      expect(stats.requestsByMethod['GET']).toBe(1);
      expect(stats.requestsByMethod['POST']).toBe(1);
    });
  });
});
