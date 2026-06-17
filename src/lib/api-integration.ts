/**
 * API Integration - Unified API client for GitHub and other services
 */

export interface GitHubConfig {
  token?: string;
  owner: string;
  repo: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  type: 'User' | 'Bot';
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: number;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

class GitHubAPI {
  private baseUrl = 'https://api.github.com';
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'OpenMaintainer/1.0',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options?.headers },
      });

      const rateLimit = {
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0'),
      };

      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          rateLimit,
        };
      }

      const data = await response.json();
      return { data, status: response.status, rateLimit };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      };
    }
  }

  async getRepository(owner: string, repo: string): Promise<APIResponse<Repository>> {
    return this.request<Repository>(`/repos/${owner}/${repo}`);
  }

  async getContributors(owner: string, repo: string): Promise<APIResponse<Contributor[]>> {
    return this.request<Contributor[]>(`/repos/${owner}/${repo}/contributors`);
  }

  async getIssues(owner: string, repo: string, params?: { state?: 'open' | 'closed' | 'all'; labels?: string }): Promise<APIResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.labels) query.set('labels', params.labels);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/repos/${owner}/${repo}/issues${queryStr}`);
  }

  async getPulls(owner: string, repo: string, params?: { state?: 'open' | 'closed' | 'all' }): Promise<APIResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/repos/${owner}/${repo}/pulls${queryStr}`);
  }

  async createIssue(owner: string, repo: string, issue: { title: string; body?: string; labels?: string[] }): Promise<APIResponse<any>> {
    return this.request<any>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(issue),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createComment(owner: string, repo: string, issueNumber: number, body: string): Promise<APIResponse<any>> {
    return this.request<any>(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]): Promise<APIResponse<any>> {
    return this.request<any>(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labels }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getRateLimit(): RateLimitInfo | null {
    // In a real implementation, this would track rate limits
    return null;
  }
}

export function createGitHubClient(token?: string): GitHubAPI {
  return new GitHubAPI(token);
}

export interface WebhookEvent {
  type: 'push' | 'pull_request' | 'issues' | 'release' | 'star' | 'fork';
  action?: string;
  repository: Repository;
  sender: { login: string; type: string };
  payload?: Record<string, any>;
}

export function parseWebhookEvent(eventType: string, payload: any): WebhookEvent | null {
  const eventMap: Record<string, WebhookEvent['type']> = {
    'push': 'push',
    'pull_request': 'pull_request',
    'issues': 'issues',
    'release': 'release',
    'star': 'star',
    'fork': 'fork',
  };

  const type = eventMap[eventType];
  if (!type || !payload.repository) return null;

  return {
    type,
    action: payload.action,
    repository: payload.repository,
    sender: payload.sender,
    payload,
  };
}

export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // In production, implement HMAC-SHA256 validation
  // For now, return true for development
  return true;
}
