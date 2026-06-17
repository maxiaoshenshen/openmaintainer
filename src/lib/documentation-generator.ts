/**
 * Documentation Generator - Auto-generate and maintain project documentation
 */

export interface DocSection {
  id: string;
  title: string;
  content: string;
  order: number;
  children?: DocSection[];
}

export interface Documentation {
  title: string;
  description: string;
  sections: DocSection[];
  lastUpdated: number;
  version: string;
}

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  tags?: string[];
}

export interface APIParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required: boolean;
  type: string;
  description?: string;
  example?: string;
}

export interface APIRequestBody {
  description?: string;
  contentType: string;
  schema: Record<string, any>;
  example?: any;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema?: Record<string, any>;
  example?: any;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  changes: string[];
  breaking?: string[];
}

/**
 * Generate README documentation
 */
export function generateReadme(params: {
  projectName: string;
  description: string;
  features?: string[];
  installation?: string[];
  usage?: string[];
  contributing?: string;
  license?: string;
  badges?: { label: string; url: string }[];
}): Documentation {
  const sections: DocSection[] = [];
  
  // Add Features section
  if (params.features && params.features.length > 0) {
    sections.push({
      id: "features",
      title: "✨ Features",
      content: params.features.map(f => `- ${f}`).join("\n"),
      order: 2,
    });
  }
  
  // Add Installation section
  if (params.installation && params.installation.length > 0) {
    sections.push({
      id: "installation",
      title: "📦 Installation",
      content: params.installation.map((cmd, i) => `${i + 1}. \`${cmd}\``).join("\n"),
      order: 3,
    });
  }
  
  // Add Usage section
  if (params.usage && params.usage.length > 0) {
    sections.push({
      id: "usage",
      title: "🚀 Quick Start",
      content: params.usage.map(u => `\`\`\`\n${u}\n\`\`\``).join("\n\n"),
      order: 4,
    });
  }
  
  // Add Contributing section
  if (params.contributing) {
    sections.push({
      id: "contributing",
      title: "🤝 Contributing",
      content: params.contributing,
      order: 5,
    });
  }
  
  // Add License section
  if (params.license) {
    sections.push({
      id: "license",
      title: "📄 License",
      content: `This project is licensed under the ${params.license} License.`,
      order: 6,
    });
  }
  
  return {
    title: params.projectName,
    description: params.description,
    sections: sections.sort((a, b) => a.order - b.order),
    lastUpdated: Date.now(),
    version: "1.0.0",
  };
}

/**
 * Generate API documentation
 */
export function generateAPIDocs(endpoints: APIEndpoint[]): string {
  let md = "# API Documentation\n\n";
  
  // Group by tags
  const byTag = new Map<string, APIEndpoint[]>();
  for (const endpoint of endpoints) {
    const tag = endpoint.tags?.[0] || "General";
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag)!.push(endpoint);
  }
  
  for (const [tag, tagEndpoints] of byTag) {
    md += `## ${tag}\n\n`;
    
    for (const endpoint of tagEndpoints) {
      md += `### ${endpoint.method} ${endpoint.path}\n\n`;
      md += `${endpoint.summary}\n\n`;
      
      if (endpoint.description) {
        md += `${endpoint.description}\n\n`;
      }
      
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        md += "**Parameters:**\n\n";
        md += "| Name | In | Type | Required | Description |\n";
        md += "|------|-----|------|----------|-------------|\n";
        for (const param of endpoint.parameters) {
          md += `| ${param.name} | ${param.in} | ${param.type} | ${param.required ? "Yes" : "No"} | ${param.description || ""} |\n`;
        }
        md += "\n";
      }
      
      if (endpoint.requestBody) {
        md += "**Request Body:**\n\n";
        if (endpoint.requestBody.description) {
          md += `${endpoint.requestBody.description}\n\n`;
        }
        if (endpoint.requestBody.example) {
          md += "```json\n" + JSON.stringify(endpoint.requestBody.example, null, 2) + "\n```\n\n";
        }
      }
      
      md += "**Responses:**\n\n";
      for (const response of endpoint.responses) {
        md += `- \`${response.statusCode}\` - ${response.description}\n`;
      }
      md += "\n";
    }
  }
  
  return md;
}

/**
 * Generate changelog from commits
 */
export function generateChangelog(entries: ChangelogEntry[]): string {
  let md = "# Changelog\n\n";
  
  for (const entry of entries) {
    const emoji = entry.type === "major" ? "💥" : entry.type === "minor" ? "✨" : "🐛";
    md += `## ${emoji} [${entry.version}] - ${entry.date}\n\n`;
    
    if (entry.breaking && entry.breaking.length > 0) {
      md += "### ⚠️ Breaking Changes\n\n";
      md += entry.breaking.map(c => `- ${c}`).join("\n") + "\n\n";
    }
    
    md += "### Changes\n\n";
    md += entry.changes.map(c => `- ${c}`).join("\n") + "\n\n";
  }
  
  return md;
}

/**
 * Generate CONTRIBUTING guide
 */
export function generateContributingGuide(params: {
  projectName: string;
  setupCommands?: string[];
  developmentWorkflow?: string[];
  commitRules?: string[];
  prGuidelines?: string[];
  codeStyle?: string;
}): string {
  let md = `# Contributing to ${params.projectName}\n\n`;
  
  md += "Thank you for your interest in contributing! This guide will help you get started.\n\n";
  
  if (params.setupCommands && params.setupCommands.length > 0) {
    md += "## Setup\n\n";
    md += "```bash\n" + params.setupCommands.join("\n") + "\n```\n\n";
  }
  
  if (params.developmentWorkflow && params.developmentWorkflow.length > 0) {
    md += "## Development Workflow\n\n";
    md += params.developmentWorkflow.map(step => `${step}`).join("\n") + "\n\n";
  }
  
  if (params.commitRules && params.commitRules.length > 0) {
    md += "## Commit Message Format\n\n";
    md += "We follow [Conventional Commits](https://www.conventionalcommits.org/):\n\n";
    md += "```\n<type>(<scope>): <description>\n\n[optional body]\n\n[optional footer(s)]\n```\n\n";
    md += "Types:\n";
    for (const rule of params.commitRules) {
      md += `- ${rule}\n`;
    }
    md += "\n";
  }
  
  if (params.prGuidelines && params.prGuidelines.length > 0) {
    md += "## Pull Request Guidelines\n\n";
    md += params.prGuidelines.map(g => `- ${g}`).join("\n") + "\n\n";
  }
  
  if (params.codeStyle) {
    md += "## Code Style\n\n" + params.codeStyle + "\n\n";
  }
  
  md += "---\n\n";
  md += "Last updated: " + new Date().toISOString().split("T")[0] + "\n";
  
  return md;
}

/**
 * Generate badges HTML
 */
export function generateBadges(badges: { label: string; url: string; logo?: string }[]): string {
  return badges
    .map(b => `[![${b.label}](${b.url})](${b.url.replace(/\/badge\/.*/, "")})`)
    .join(" ");
}

/**
 * Generate comparison table
 */
export function generateComparisonTable(
  headers: string[],
  rows: string[][]
): string {
  let md = "| " + headers.join(" | ") + " |\n";
  md += "| " + headers.map(() => "---").join(" | ") + " |\n";
  
  for (const row of rows) {
    md += "| " + row.join(" | ") + " |\n";
  }
  
  return md;
}

/**
 * Build documentation index
 */
export function buildDocIndex(docs: Documentation[]): {
  total: number;
  recentlyUpdated: Documentation[];
  byCategory: Record<string, number>;
} {
  const recentlyUpdated = [...docs]
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 5);
  
  return {
    total: docs.length,
    recentlyUpdated,
    byCategory: {
      "API": docs.filter(d => d.title.includes("API")).length,
      "Guide": docs.filter(d => d.title.includes("Guide") || d.title.includes("Tutorial")).length,
      "Reference": docs.filter(d => d.title.includes("Reference")).length,
    },
  };
}
