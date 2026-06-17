/**
 * Data Export - Export maintainer data in various formats
 */

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'html' | 'pdf' | 'yaml';

export interface ExportConfig {
  format: ExportFormat;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
  dateFormat?: string;
}

export interface ExportableData {
  repositories?: any[];
  contributors?: any[];
  issues?: any[];
  pullRequests?: any[];
  metrics?: any;
  metadata?: {
    exportedAt: string;
    version: string;
    maintainer: string;
  };
}

export function exportToJSON(data: ExportableData, config?: Partial<ExportConfig>): string {
  const output = config?.prettyPrint !== false ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  return output;
}

export function exportToCSV(data: any[], columns?: string[]): string {
  if (data.length === 0) return '';

  const keys = columns || Object.keys(data[0]);
  const header = keys.join(',');
  
  const rows = data.map(item => {
    return keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

export function exportToMarkdown(data: any, title?: string): string {
  let md = '';
  
  if (title) {
    md += `# ${title}\n\n`;
  }
  
  if (data.metadata) {
    md += `**Exported:** ${data.metadata.exportedAt}\n`;
    md += `**Maintainer:** ${data.metadata.maintainer}\n\n---\n\n`;
  }

  if (data.repositories) {
    md += `## Repositories\n\n`;
    md += `| Name | Stars | Forks | Open Issues | Language |\n`;
    md += `|------|-------|-------|-------------|----------|\n`;
    data.repositories.forEach(repo => {
      md += `| ${repo.name} | ${repo.stars} | ${repo.forks} | ${repo.openIssues} | ${repo.language} |\n`;
    });
    md += '\n';
  }

  if (data.contributors) {
    md += `## Top Contributors\n\n`;
    data.contributors.slice(0, 10).forEach((contributor, i) => {
      md += `${i + 1}. ${contributor.login} - ${contributor.contributions} contributions\n`;
    });
    md += '\n';
  }

  if (data.metrics) {
    md += `## Metrics Summary\n\n`;
    Object.entries(data.metrics).forEach(([key, value]) => {
      md += `- **${formatLabel(key)}**: ${value}\n`;
    });
    md += '\n';
  }

  return md;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function exportToHTML(data: ExportableData, title?: string): string {
  const date = new Date().toLocaleString();
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'OpenMaintainer Export'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #24292f; border-bottom: 2px solid #0969da; padding-bottom: 10px; }
    h2 { color: #24292f; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #d0d7de; padding: 12px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
    tr:nth-child(even) { background: #f6f8fa; }
    .meta { color: #57606a; font-size: 14px; }
    .metric { display: inline-block; background: #ddf4ff; padding: 5px 10px; border-radius: 20px; margin: 5px; }
  </style>
</head>
<body>
  <h1>${title || 'Maintainer Report'}</h1>
  <p class="meta">Generated on ${date}</p>
`;

  if (data.repositories) {
    html += `  <h2>Repositories</h2>
  <table>
    <thead><tr><th>Name</th><th>⭐ Stars</th><th>🍴 Forks</th><th>📋 Issues</th><th>Language</th></tr></thead>
    <tbody>
`;
    data.repositories.forEach(repo => {
      html += `      <tr><td>${repo.name}</td><td>${repo.stars}</td><td>${repo.forks}</td><td>${repo.openIssues}</td><td>${repo.language}</td></tr>\n`;
    });
    html += `    </tbody></table>\n`;
  }

  if (data.metrics) {
    html += `  <h2>Metrics</h2>
  <div class="metrics">\n`;
    Object.entries(data.metrics).forEach(([key, value]) => {
      html += `    <span class="metric">${formatLabel(key)}: ${value}</span>\n`;
    });
    html += `  </div>\n`;
  }

  html += `</body></html>`;
  return html;
}

export function exportToYAML(data: ExportableData): string {
  // Simple YAML serialization
  return toYAMLString(data);
}

function toYAMLString(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (obj === null || obj === undefined) return 'null\n';
  if (typeof obj === 'boolean') return `${obj}\n`;
  if (typeof obj === 'number') return `${obj}\n`;
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
    }
    return `${obj}\n`;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]\n';
    return obj.map(item => {
      const itemYaml = toYAMLString(item, indent);
      if (typeof item === 'object' && item !== null) {
        return `${spaces}- ${itemYaml.trim().split('\n').join('\n' + spaces + '  ')}`;
      }
      return `${spaces}- ${itemYaml}`;
    }).join('\n') + '\n';
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}\n';
    return entries.map(([key, value]) => {
      const valueYaml = toYAMLString(value, indent + 1);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${spaces}${key}:\n${valueYaml}`;
      }
      return `${spaces}${key}: ${valueYaml}`;
    }).join('\n') + '\n';
  }
  
  return String(obj);
}

export function generateFilename(prefix: string, format: ExportFormat): string {
  const date = new Date().toISOString().split('T')[0];
  const ext = format === 'markdown' ? 'md' : format;
  return `${prefix}-${date}.${ext}`;
}

export function createExportBundle(data: ExportableData, configs: ExportConfig[]): 
  { format: ExportFormat; content: string; filename: string }[] {
  return configs.map(config => ({
    format: config.format,
    content: exportData(data, config),
    filename: generateFilename('maintainer-report', config.format),
  }));
}

function exportData(data: ExportableData, config: ExportConfig): string {
  switch (config.format) {
    case 'json': return exportToJSON(data, config);
    case 'csv': return exportToCSV(data.repositories || []);
    case 'markdown': return exportToMarkdown(data);
    case 'html': return exportToHTML(data);
    case 'yaml': return exportToYAML(data);
    default: return exportToJSON(data, config);
  }
}
