/**
 * Share Store - Persist and manage shared maintainer reports
 * 
 * Enables maintainers to share their analysis summaries via URL
 */

export interface SharedReport {
  id: string;
  repositoryName: string;
  repositoryFullName: string;
  createdAt: number;
  summary: string;
  healthScore: number;
  readinessScore: number;
  topContributors: number;
  openIssues: number;
  pullRequests: number;
  commandCount: number;
  tokenCost: number;
}

const SHARED_REPORTS_KEY = "openmaintainer:shared-reports";
const MAX_SHARED_REPORTS = 50;

/**
 * Generate a unique ID for a shared report
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`;
}

/**
 * Encode report data into a compact URL-safe string
 */
function encodeReport(report: SharedReport): string {
  try {
    const data = JSON.stringify(report);
    // Use base64url encoding for URL safety
    const base64 = btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return base64;
  } catch {
    return '';
  }
}

/**
 * Decode report data from a compact URL-safe string
 */
function decodeReport(encoded: string): SharedReport | null {
  try {
    // Restore base64 padding
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const data = atob(base64);
    return JSON.parse(data) as SharedReport;
  } catch {
    return null;
  }
}

/**
 * Create a shareable report from current analysis state
 */
export function createSharedReport(
  repositoryFullName: string,
  healthScore: number,
  readinessScore: number,
  openIssues: number,
  pullRequests: number,
  commandCount: number,
  tokenCost: number
): SharedReport {
  const report: SharedReport = {
    id: generateId(),
    repositoryName: repositoryFullName.split('/').pop() || repositoryFullName,
    repositoryFullName,
    createdAt: Date.now(),
    summary: `Health: ${healthScore}/100 | Readiness: ${readinessScore}/100 | ${openIssues} open issues | ${pullRequests} PRs`,
    healthScore,
    readinessScore,
    topContributors: 0,
    openIssues,
    pullRequests,
    commandCount,
    tokenCost,
  };
  return report;
}

/**
 * Save a shared report to localStorage
 */
export function saveSharedReport(storage: Storage, report: SharedReport): void {
  try {
    const reports = readSharedReports(storage);
    // Add to front
    reports.unshift(report);
    // Limit count
    const trimmed = reports.slice(0, MAX_SHARED_REPORTS);
    storage.setItem(SHARED_REPORTS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save shared report:', e);
  }
}

/**
 * Read all shared reports from localStorage
 */
export function readSharedReports(storage: Storage): SharedReport[] {
  try {
    const data = storage.getItem(SHARED_REPORTS_KEY);
    if (!data) return [];
    return JSON.parse(data) as SharedReport[];
  } catch {
    return [];
  }
}

/**
 * Delete a shared report by ID
 */
export function deleteSharedReport(storage: Storage, id: string): void {
  try {
    const reports = readSharedReports(storage);
    const filtered = reports.filter(r => r.id !== id);
    storage.setItem(SHARED_REPORTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete shared report:', e);
  }
}

/**
 * Generate a shareable URL for a report
 */
export function generateShareUrl(report: SharedReport): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://openmaintainer.vercel.app';
  const encoded = encodeReport(report);
  return `${baseUrl}/share/${encoded}`;
}

/**
 * Parse a share URL and extract report data
 */
export function parseShareUrl(pathname: string): SharedReport | null {
  const match = pathname.match(/^\/share\/(.+)$/);
  if (!match) return null;
  return decodeReport(match[1]);
}

/**
 * Format a timestamp for display
 */
export function formatSharedDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
