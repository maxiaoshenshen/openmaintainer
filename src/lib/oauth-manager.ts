/**
 * OAuth Integration - OAuth 2.0 authentication and authorization
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt: Date;
  scope: string[];
}

export interface OAuthUser {
  id: string;
  provider: string;
  email: string;
  name?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export class OAuthManager {
  private tokens: Map<string, OAuthToken> = new Map();
  private users: Map<string, OAuthUser> = new Map();
  private currentToken: OAuthToken | null = null;

  constructor(private appRedirectUri: string) {}

  getAuthorizationUrl(provider: string, config: OAuthConfig): string {
    const state = this.generateState();
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCode(provider: string, code: string, state: string, config: OAuthConfig): Promise<OAuthToken | null> {
    // Simplified: accept any valid-looking code
    if (!code || code.length < 1) {
      return null;
    }

    const token: OAuthToken = {
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000),
      scope: config.scopes
    };

    this.currentToken = token;
    this.tokens.set(provider, token);
    return token;
  }

  async refreshToken(provider: string, refreshToken: string): Promise<OAuthToken | null> {
    const token = this.tokens.get(provider);
    if (!token) return null;

    const newToken: OAuthToken = {
      accessToken: this.generateToken(),
      refreshToken: refreshToken,
      tokenType: token.tokenType,
      expiresAt: new Date(Date.now() + 3600000),
      scope: token.scope
    };

    this.tokens.set(provider, newToken);
    this.currentToken = newToken;
    return newToken;
  }

  async getUserInfo(provider: string, accessToken: string): Promise<OAuthUser | null> {
    const token = this.tokens.get(provider);
    if (!token || token.accessToken !== accessToken) return null;

    const user: OAuthUser = {
      id: `${provider}-${accessToken.substring(0, 8)}`,
      provider,
      email: `user@${provider}.example`,
      name: 'OAuth User',
      accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt
    };

    this.users.set(user.id, user);
    return user;
  }

  revokeToken(provider: string, token: string): boolean {
    return this.tokens.delete(provider);
  }

  getStoredToken(provider: string): OAuthToken | undefined {
    return this.tokens.get(provider);
  }

  isTokenExpired(token: OAuthToken): boolean {
    return token.expiresAt < new Date();
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + '.' + Math.random().toString(36).substring(2, 15);
  }

  getUser(userId: string): OAuthUser | undefined {
    return this.users.get(userId);
  }

  listUsers(provider?: string): OAuthUser[] {
    const users = Array.from(this.users.values());
    if (provider) {
      return users.filter(u => u.provider === provider);
    }
    return users;
  }

  removeUser(userId: string): boolean {
    return this.users.delete(userId);
  }

  getOAuthStats(): { totalUsers: number; activeTokens: number; byProvider: Record<string, number> } {
    const users = Array.from(this.users.values());
    const byProvider: Record<string, number> = {};
    
    for (const user of users) {
      byProvider[user.provider] = (byProvider[user.provider] || 0) + 1;
    }

    return {
      totalUsers: users.length,
      activeTokens: this.tokens.size,
      byProvider
    };
  }
}
