/**
 * Export to CSV - Export repository data to CSV format
 */

export interface ExportablePR {
  number: number;
  title: string;
  author: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  labels: string[];
  reviewStatus?: string;
  mergedAt?: string;
}

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string }>
): string {
  const headers = columns.map((col) => `"${col.header}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const stringValue = Array.isArray(value) ? value.join("; ") : String(value ?? "");
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers, ...rows].join("\n");
}

/**
 * Export pull requests to CSV
 */
export function exportPullRequestsCSV(prs: ExportablePR[]): string {
  return toCSV(prs, [
    { key: "number", header: "PR Number" },
    { key: "title", header: "Title" },
    { key: "author", header: "Author" },
    { key: "status", header: "Status" },
    { key: "reviewStatus", header: "Review Status" },
    { key: "createdAt", header: "Created" },
    { key: "updatedAt", header: "Updated" },
    { key: "mergedAt", header: "Merged" },
    { key: "labels", header: "Labels" },
    { key: "url", header: "URL" },
  ]);
}

/**
 * Export issues to CSV
 */
export function exportIssuesCSV(issues: Array<{
  number: number;
  title: string;
  author: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  labels: string[];
  comments: number;
}>): string {
  return toCSV(issues, [
    { key: "number", header: "Issue Number" },
    { key: "title", header: "Title" },
    { key: "author", header: "Author" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Created" },
    { key: "updatedAt", header: "Updated" },
    { key: "comments", header: "Comments" },
    { key: "labels", header: "Labels" },
    { key: "url", header: "URL" },
  ]);
}

/**
 * Download a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger CSV download for PRs
 */
export function downloadPullRequestsCSV(prs: ExportablePR[], repoName: string): void {
  const csv = exportPullRequestsCSV(prs);
  const filename = `${repoName.replace("/", "-")}-pull-requests-${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename, "text/csv");
}

/**
 * Trigger CSV download for issues
 */
export function downloadIssuesCSV(issues: Parameters<typeof exportIssuesCSV>[0], repoName: string): void {
  const csv = exportIssuesCSV(issues);
  const filename = `${repoName.replace("/", "-")}-issues-${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename, "text/csv");
}
