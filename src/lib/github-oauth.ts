/**
 * GitHub OAuth Integration
 * 
 * Handle GitHub authentication for saving user preferences and history
 */

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  htmlUrl: string;
}

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";
const GITHUB_REDIRECT_URI = typeof window !== "undefined" 
  ? `${window.location.origin}/api/auth/github/callback`
  : "";

/**
 * Generate GitHub OAuth URL for login
 */
export function getGitHubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "read:user user:email",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Parse OAuth callback code
 */
export function parseAuthCallback(url: string): string | null {
  const params = new URL(url).searchParams;
  return params.get("code");
}

/**
 * Store GitHub token securely
 */
export function storeGitHubToken(storage: Storage, token: string): void {
  storage.setItem("github_token", token);
}

/**
 * Read GitHub token
 */
export function readGitHubToken(storage: Storage): string | null {
  return storage.getItem("github_token");
}

/**
 * Clear GitHub token (logout)
 */
export function clearGitHubToken(storage: Storage): void {
  storage.removeItem("github_token");
  storage.removeItem("github_user");
}

/**
 * Store GitHub user data
 */
export function storeGitHubUser(storage: Storage, user: GitHubUser): void {
  storage.setItem("github_user", JSON.stringify(user));
}

/**
 * Read GitHub user data
 */
export function readGitHubUser(storage: Storage): GitHubUser | null {
  try {
    const data = storage.getItem("github_user");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(storage: Storage): boolean {
  return !!readGitHubToken(storage);
}

/**
 * Get user display name
 */
export function getUserDisplayName(storage: Storage): string {
  const user = readGitHubUser(storage);
  return user?.name || user?.login || "User";
}

/**
 * Format GitHub API rate limit info
 */
export function formatRateLimit(remaining: number, limit: number, resetTime: number): string {
  const resetDate = new Date(resetTime * 1000);
  const timeUntilReset = Math.max(0, Math.floor((resetDate.getTime() - Date.now()) / 1000 / 60));
  return `${remaining}/${limit} requests remaining. Resets in ${timeUntilReset} minutes.`;
}
