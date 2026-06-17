/**
 * API Documentation Generator
 * Auto-generate API docs from code or OpenAPI specs
 */

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary?: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses?: APIResponse[];
  tags?: string[];
  deprecated?: boolean;
  security?: string[];
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  type: string;
  description?: string;
  default?: unknown;
  enum?: string[];
}

export interface APIRequestBody {
  required?: boolean;
  contentType?: string;
  schema?: APISchema;
  example?: Record<string, unknown>;
}

export interface APISchema {
  type: string;
  properties?: Record<string, APISchemaProperty>;
  required?: string[];
  items?: APISchema;
  description?: string;
  example?: unknown;
}

export interface APISchemaProperty {
  type: string;
  format?: string;
  description?: string;
  example?: unknown;
  default?: unknown;
  enum?: string[];
  nullable?: boolean;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  contentType?: string;
  schema?: APISchema;
  example?: unknown;
}

export interface APIDocument {
  title: string;
  version: string;
  description?: string;
  baseUrl?: string;
  endpoints: APIEndpoint[];
  tags: string[];
}

/**
 * Generate OpenAPI 3.0 specification
 */
export function generateOpenAPISpec(doc: APIDocument): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const endpoint of doc.endpoints) {
    const pathItem: Record<string, unknown> = {};
    const method = endpoint.method.toLowerCase();
    
    pathItem[method] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      deprecated: endpoint.deprecated,
      parameters: endpoint.parameters?.map(p => ({
        name: p.name,
        in: p.in,
        required: p.required,
        schema: { type: p.type },
        description: p.description,
        default: p.default,
        ...(p.enum ? { enum: p.enum } : {}),
      })),
      requestBody: endpoint.requestBody ? {
        required: endpoint.requestBody.required,
        content: {
          [endpoint.requestBody.contentType || 'application/json']: {
            schema: endpoint.requestBody.schema,
            example: endpoint.requestBody.example,
          },
        },
      } : undefined,
      responses: Object.fromEntries(
        (endpoint.responses || []).map(r => [
          r.statusCode.toString(),
          {
            description: r.description,
            content: r.contentType ? {
              [r.contentType]: {
                schema: r.schema,
                example: r.example,
              },
            } : undefined,
          },
        ])
      ),
      security: endpoint.security?.map(s => ({ [s]: [] })),
    };

    paths[endpoint.path] = { ...paths[endpoint.path], ...pathItem };
  }

  return {
    openapi: '3.0.0',
    info: {
      title: doc.title,
      version: doc.version,
      description: doc.description,
    },
    servers: doc.baseUrl ? [{ url: doc.baseUrl }] : undefined,
    paths,
    components: {
      schemas: extractSchemas(doc),
    },
    tags: doc.tags.map(name => ({ name })),
  };
}

/**
 * Extract all unique schemas from endpoints
 */
function extractSchemas(doc: APIDocument): Record<string, APISchema> {
  const schemas: Record<string, APISchema> = {};

  for (const endpoint of doc.endpoints) {
    if (endpoint.requestBody?.schema?.properties) {
      for (const [name, prop] of Object.entries(endpoint.requestBody.schema.properties)) {
        schemas[name] = { type: 'object', properties: { [name]: prop } };
      }
    }
  }

  return schemas;
}

/**
 * Generate Markdown documentation
 */
export function generateMarkdownDoc(doc: APIDocument): string {
  let md = `# ${doc.title}\n\n`;
  
  if (doc.description) {
    md += `${doc.description}\n\n`;
  }
  
  md += `**Version:** ${doc.version}\n`;
  if (doc.baseUrl) {
    md += `**Base URL:** ${doc.baseUrl}\n`;
  }
  md += '\n---\n\n';

  // Group by tags
  const byTag = new Map<string, APIEndpoint[]>();
  for (const endpoint of doc.endpoints) {
    const tag = endpoint.tags?.[0] || 'General';
    const existing = byTag.get(tag) || [];
    existing.push(endpoint);
    byTag.set(tag, existing);
  }

  for (const [tag, endpoints] of byTag) {
    md += `## ${tag}\n\n`;
    
    for (const endpoint of endpoints) {
      md += `### ${endpoint.method} ${endpoint.path}\n\n`;
      
      if (endpoint.summary) {
        md += `**${endpoint.summary}**\n\n`;
      }
      
      if (endpoint.description) {
        md += `${endpoint.description}\n\n`;
      }
      
      if (endpoint.deprecated) {
        md += `> ⚠️ **Deprecated**\n\n`;
      }
      
      if (endpoint.parameters?.length) {
        md += `#### Parameters\n\n`;
        md += `| Name | In | Type | Required | Description |\n`;
        md += `|------|-----|------|----------|-------------|\n`;
        for (const p of endpoint.parameters) {
          md += `| ${p.name} | ${p.in} | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.description || '-'} |\n`;
        }
        md += '\n';
      }
      
      if (endpoint.requestBody) {
        md += `#### Request Body\n\n`;
        md += `**Content-Type:** ${endpoint.requestBody.contentType || 'application/json'}\n\n`;
        if (endpoint.requestBody.example) {
          md += '```json\n' + JSON.stringify(endpoint.requestBody.example, null, 2) + '\n```\n\n';
        }
      }
      
      if (endpoint.responses?.length) {
        md += `#### Responses\n\n`;
        for (const r of endpoint.responses) {
          md += `**${r.statusCode}** - ${r.description}\n`;
        }
        md += '\n';
      }
      
      md += '---\n\n';
    }
  }

  return md;
}

/**
 * Generate Postman collection
 */
export function generatePostmanCollection(doc: APIDocument): Record<string, unknown> {
  return {
    info: {
      name: doc.title,
      description: doc.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: doc.endpoints.map(endpoint => ({
      name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        header: [],
        url: {
          raw: `${doc.baseUrl || ''}${endpoint.path}`,
          host: [doc.baseUrl?.replace(/^https?:\/\//, '') || 'api'],
          path: endpoint.path.split('/').filter(Boolean),
          query: endpoint.parameters
            ?.filter(p => p.in === 'query')
            .map(p => ({ key: p.name, value: p.default?.toString() || '' })),
        },
        description: endpoint.description,
      },
    })),
  };
}

/**
 * Parse JSDoc comments to extract API info
 */
export function parseJSDocAPI(docComment: string): Partial<APIDocument> {
  const lines = docComment.split('\n');
  const result: Partial<APIDocument> = {};
  
  for (const line of lines) {
    const match = line.match(/@(\w+)\s+(.*)/);
    if (match) {
      const [, tag, value] = match;
      switch (tag) {
        case 'title':
        case 'name':
          result.title = value;
          break;
        case 'version':
          result.version = value;
          break;
        case 'description':
          result.description = value;
          break;
        case 'baseUrl':
        case 'baseURL':
          result.baseUrl = value;
          break;
      }
    }
  }
  
  return result;
}

/**
 * Generate type definitions from API schema
 */
export function generateTypeDefinitions(doc: APIDocument): string {
  let types = '// Auto-generated types\n\n';
  
  const seen = new Set<string>();
  
  for (const endpoint of doc.endpoints) {
    if (endpoint.requestBody?.schema?.properties) {
      for (const [name, prop] of Object.entries(endpoint.requestBody.schema.properties)) {
        if (!seen.has(name)) {
          seen.add(name);
          types += `export interface ${name} {\n`;
          types += `  ${name}: ${mapType(prop.type)};\n`;
          types += `}\n\n`;
        }
      }
    }
    
    if (endpoint.responses?.some(r => r.schema?.properties)) {
      for (const response of endpoint.responses) {
        if (response.schema?.properties) {
          for (const [name, prop] of Object.entries(response.schema.properties)) {
            if (!seen.has(name)) {
              seen.add(name);
              types += `export interface ${name}Response {\n`;
              for (const [pName, pProp] of Object.entries(response.schema.properties)) {
                types += `  ${pName}: ${mapType(pProp.type)};\n`;
              }
              types += `}\n\n`;
            }
          }
        }
      }
    }
  }
  
  return types;
}

function mapType(type: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    integer: 'number',
    number: 'number',
    boolean: 'boolean',
    array: 'unknown[]',
    object: 'Record<string, unknown>',
  };
  return typeMap[type] || 'unknown';
}
