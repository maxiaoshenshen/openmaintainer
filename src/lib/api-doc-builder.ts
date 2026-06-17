/**
 * API Documentation Builder - Generate and manage API documentation
 */

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  tags?: string[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  type: string;
  required: boolean;
  description?: string;
  default?: unknown;
  enum?: string[];
}

export interface APIRequestBody {
  description?: string;
  contentType: string;
  schema: Record<string, unknown>;
  example?: unknown;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  contentType?: string;
  schema?: Record<string, unknown>;
  example?: unknown;
}

export interface APISchema {
  name: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'enum';
  properties?: Record<string, APISchema>;
  items?: APISchema;
  enum?: string[];
  required?: string[];
  description?: string;
  example?: unknown;
}

export interface APIDocument {
  title: string;
  version: string;
  description?: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: Map<string, APISchema>;
  tags: Map<string, { name: string; description?: string }>;
  toJSON(): string;
  toMarkdown(): string;
}

export class APIDocBuilder {
  private document: APIDocument;
  private currentEndpoint: APIEndpoint | null = null;

  constructor(title: string, version: string, baseUrl: string) {
    this.document = {
      title,
      version,
      baseUrl,
      endpoints: [],
      schemas: new Map(),
      tags: new Map(),
      toJSON: () => JSON.stringify({
        title: this.document.title,
        version: this.document.version,
        description: this.document.description,
        baseUrl: this.document.baseUrl,
        endpoints: this.document.endpoints,
        schemas: Object.fromEntries(this.document.schemas),
        tags: Object.fromEntries(this.document.tags)
      }, null, 2),
      toMarkdown: () => {
        let md = `# ${this.document.title}\n\n`;
        md += `**Version:** ${this.document.version}\n\n`;
        if (this.document.description) md += `${this.document.description}\n\n`;
        md += `**Base URL:** ${this.document.baseUrl}\n\n`;
        if (this.document.tags.size > 0) {
          md += `## Tags\n\n`;
          for (const [, tag] of this.document.tags) {
            md += `- **${tag.name}**${tag.description ? `: ${tag.description}` : ''}\n`;
          }
          md += `\n`;
        }
        md += `## Endpoints\n\n`;
        for (const endpoint of this.document.endpoints) {
          md += `### ${endpoint.method} ${endpoint.path}\n\n`;
          md += `**${endpoint.summary}**\n\n`;
          if (endpoint.deprecated) md += `> **DEPRECATED**\n\n`;
          if (endpoint.description) md += `${endpoint.description}\n\n`;
          if (endpoint.parameters?.length) {
            md += `#### Parameters\n\n`;
            md += `| Name | In | Type | Required | Description |\n|------|-----|------|----------|-------------|\n`;
            for (const p of endpoint.parameters) {
              md += `| ${p.name} | ${p.in} | ${p.type} | ${p.required} | ${p.description || ''} |\n`;
            }
            md += `\n`;
          }
          if (endpoint.responses.length) {
            md += `#### Responses\n\n`;
            for (const r of endpoint.responses) {
              md += `- **${r.statusCode}**: ${r.description}\n`;
            }
            md += `\n`;
          }
        }
        return md;
      }
    } as APIDocument;
  }

  setDescription(description: string): this {
    this.document.description = description;
    return this;
  }

  addTag(name: string, description?: string): this {
    this.document.tags.set(name, { name, description });
    return this;
  }

  addSchema(schema: APISchema): this {
    this.document.schemas.set(schema.name, schema);
    return this;
  }

  addEndpoint(endpoint: APIEndpoint): this {
    this.document.endpoints.push(endpoint);
    return this;
  }

  private createEndpoint(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, summary: string): this {
    this.currentEndpoint = { method, path, summary, responses: [] };
    return this;
  }

  get(path: string, summary: string): this {
    return this.createEndpoint('GET', path, summary);
  }

  post(path: string, summary: string): this {
    return this.createEndpoint('POST', path, summary);
  }

  put(path: string, summary: string): this {
    return this.createEndpoint('PUT', path, summary);
  }

  patch(path: string, summary: string): this {
    return this.createEndpoint('PATCH', path, summary);
  }

  delete(path: string, summary: string): this {
    return this.createEndpoint('DELETE', path, summary);
  }

  describe(description: string): this {
    if (this.currentEndpoint) {
      this.currentEndpoint.description = description;
    }
    return this;
  }

  params(params: APIParameter[]): this {
    if (this.currentEndpoint) {
      this.currentEndpoint.parameters = params;
    }
    return this;
  }

  body(body: APIRequestBody): this {
    if (this.currentEndpoint) {
      this.currentEndpoint.requestBody = body;
    }
    return this;
  }

  responses(responses: APIResponse[]): this {
    if (this.currentEndpoint) {
      this.currentEndpoint.responses = responses;
      this.document.endpoints.push(this.currentEndpoint);
      this.currentEndpoint = null;
    }
    return this;
  }

  tags(tags: string[]): this {
    if (this.currentEndpoint) {
      this.currentEndpoint.tags = tags;
    }
    return this;
  }

  deprecated(): this {
    if (this.currentEndpoint) {
      this.currentEndpoint.deprecated = true;
    }
    return this;
  }

  build(): APIDocument {
    if (this.currentEndpoint) {
      this.document.endpoints.push(this.currentEndpoint);
      this.currentEndpoint = null;
    }
    return this.document;
  }
}
