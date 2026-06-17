/**
 * GitHub Client - Simple API wrapper for GitHub operations
 */

export interface GitHubClientConfig {
  token?: string;
  baseUrl?: string;
}

export class GitHubClient {
  private token: string | undefined;
  private baseUrl: string;

  constructor(config: GitHubClientConfig = {}) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRepo(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}`);
  }

  async getIssues(owner: string, repo: string, params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/repos/${owner}/${repo}/issues${query}`);
  }

  async getPulls(owner: string, repo: string, params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/repos/${owner}/${repo}/pulls${query}`);
  }
}

export function createGitHubClient(config?: GitHubClientConfig): GitHubClient {
  return new GitHubClient(config);
}
