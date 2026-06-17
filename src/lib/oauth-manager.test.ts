import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthManager } from './oauth-manager';

describe('OAuthManager', () => {
  let manager: OAuthManager;

  beforeEach(() => {
    manager = new OAuthManager('https://app.example.com/callback');
  });

  const config = {
    clientId: 'client123',
    clientSecret: 'secret',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'user'],
    redirectUri: 'https://app.example.com/callback'
  };

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL', () => {
      const url = manager.getAuthorizationUrl('github', config);
      expect(url).toContain('github.com');
      expect(url).toContain('client_id=client123');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange code for token', async () => {
      manager.getAuthorizationUrl('github', config);
      const token = await manager.exchangeCode('github', 'auth-code', 'state-ignored', config);
      expect(token).toBeDefined();
      expect(token?.accessToken).toBeDefined();
    });

    it('should return null for empty code', async () => {
      const token = await manager.exchangeCode('github', '', 'state', config);
      expect(token).toBeNull();
    });
  });

  describe('getStoredToken', () => {
    it('should return stored token after exchange', async () => {
      manager.getAuthorizationUrl('github', config);
      await manager.exchangeCode('github', 'code', 'test-state', config);
      const token = manager.getStoredToken('github');
      expect(token).toBeDefined();
    });

    it('should return undefined for unknown provider', () => {
      expect(manager.getStoredToken('unknown')).toBeUndefined();
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired token', () => {
      const expired = { accessToken: 'token', expiresAt: new Date(Date.now() - 1000), tokenType: 'Bearer', scope: [] as string[] };
      const valid = { accessToken: 'token', expiresAt: new Date(Date.now() + 3600000), tokenType: 'Bearer', scope: [] as string[] };
      expect(manager.isTokenExpired(expired)).toBe(true);
      expect(manager.isTokenExpired(valid)).toBe(false);
    });
  });

  describe('getUserInfo', () => {
    it('should return user info', async () => {
      manager.getAuthorizationUrl('github', config);
      const token = await manager.exchangeCode('github', 'code', 'test-state', config);
      const user = await manager.getUserInfo('github', token!.accessToken);
      expect(user).toBeDefined();
      expect(user?.provider).toBe('github');
    });
  });

  describe('listUsers', () => {
    it('should list all OAuth users', async () => {
      manager.getAuthorizationUrl('github', config);
      const token = await manager.exchangeCode('github', 'code', 'test-state', config);
      await manager.getUserInfo('github', token!.accessToken);
      const users = manager.listUsers();
      expect(users.length).toBeGreaterThan(0);
    });

    it('should filter by provider', async () => {
      manager.getAuthorizationUrl('github', config);
      const token = await manager.exchangeCode('github', 'code', 'test-state', config);
      await manager.getUserInfo('github', token!.accessToken);
      const users = manager.listUsers('github');
      expect(users.every(u => u.provider === 'github')).toBe(true);
    });
  });

  describe('getOAuthStats', () => {
    it('should return OAuth statistics', async () => {
      manager.getAuthorizationUrl('github', config);
      const token = await manager.exchangeCode('github', 'code', 'test-state', config);
      await manager.getUserInfo('github', token!.accessToken);
      const stats = manager.getOAuthStats();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.activeTokens).toBeGreaterThan(0);
    });
  });
});
