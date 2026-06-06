/**
 * API Documentation Generator
 * Auto-generate API docs from code comments
 */
export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  response: { status: number; description: string; schema?: string };
  examples: { request?: string; response?: string }[];
}

export interface APIDoc {
  title: string;
  version: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  authentication: { type: string; header: string };
}

export function generateAPIDoc(title: string, version: string): APIDoc {
  const endpoints: APIEndpoint[] = [
    {
      method: "GET",
      path: "/repos/{owner}/{repo}",
      description: "Get repository details",
      parameters: [
        { name: "owner", type: "string", required: true, description: "Repository owner" },
        { name: "repo", type: "string", required: true, description: "Repository name" },
      ],
      response: { status: 200, description: "Repository details" },
      examples: [
        { response: '{ "name": "repo", "stars": 1000 }' },
      ],
    },
    {
      method: "POST",
      path: "/repos/{owner}/{repo}/issues",
      description: "Create a new issue",
      parameters: [
        { name: "owner", type: "string", required: true, description: "Repository owner" },
        { name: "repo", type: "string", required: true, description: "Repository name" },
        { name: "title", type: "string", required: true, description: "Issue title" },
        { name: "body", type: "string", required: false, description: "Issue body" },
      ],
      response: { status: 201, description: "Created issue" },
      examples: [
        { request: '{ "title": "Bug in login" }', response: '{ "id": 123 }' },
      ],
    },
    {
      method: "GET",
      path: "/repos/{owner}/{repo}/issues",
      description: "List repository issues",
      parameters: [
        { name: "owner", type: "string", required: true, description: "Repository owner" },
        { name: "repo", type: "string", required: true, description: "Repository name" },
        { name: "state", type: "string", required: false, description: "Issue state (open/closed/all)" },
      ],
      response: { status: 200, description: "List of issues" },
    },
  ];

  return {
    title,
    version,
    baseUrl: "https://api.example.com/v1",
    endpoints,
    authentication: { type: "Bearer Token", header: "Authorization" },
  };
}

export function formatEndpointMarkdown(endpoint: APIEndpoint): string {
  let md = `### ${endpoint.method} ${endpoint.path}\n\n`;
  md += `${endpoint.description}\n\n`;
  
  if (endpoint.parameters.length > 0) {
    md += "**Parameters:**\n\n";
    for (const p of endpoint.parameters) {
      md += `- \`${p.name}\` (${p.type})${p.required ? " *" : ""}: ${p.description}\n`;
    }
    md += "\n";
  }
  
  md += `**Response:** ${endpoint.response.status} - ${endpoint.response.description}\n\n`;
  
  if (endpoint.examples.length > 0) {
    md += "**Examples:**\n\n";
    for (const ex of endpoint.examples) {
      if (ex.request) md += `Request:\n\`\`\`json\n${ex.request}\n\`\`\`\n`;
      if (ex.response) md += `Response:\n\`\`\`json\n${ex.response}\n\`\`\`\n`;
    }
  }
  
  return md;
}
