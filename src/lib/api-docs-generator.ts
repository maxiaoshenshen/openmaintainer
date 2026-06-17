import { Issue, PullRequest, Contributor, Repository } from './types';

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  parameters?: APIParameter[];
  requestBody?: {
    type: string;
    properties: Record<string, APIProperty>;
    required?: string[];
  };
  responses: Record<string, APIResponse>;
  tags?: string[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required?: boolean;
  type: string;
  schema?: any;
}

export interface APIProperty {
  type: string;
  description?: string;
  format?: string;
  default?: any;
  enum?: string[];
  items?: any;
}

export interface APIResponse {
  description: string;
  content?: {
    'application/json'?: {
      schema?: any;
      example?: any;
    };
  };
  headers?: Record<string, APIProperty>;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: { url: string; description?: string }[];
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: { name: string; description?: string }[];
}

export function generateOpenAPISpec(
  name: string,
  version: string,
  endpoints: APIEndpoint[],
  options?: {
    description?: string;
    baseUrl?: string;
    serverDescription?: string;
    auth?: { type: 'bearer' | 'basic' | 'apiKey'; name?: string };
  }
): OpenAPISpec {
  const paths: Record<string, any> = {};
  
  endpoints.forEach(endpoint => {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }
    
    const pathItem: any = {
      summary: endpoint.description,
      tags: endpoint.tags || ['General'],
      deprecated: endpoint.deprecated || false
    };

    if (endpoint.description) {
      pathItem.description = endpoint.description;
    }

    if (endpoint.parameters?.length) {
      pathItem.parameters = endpoint.parameters.map(p => ({
        name: p.name,
        in: p.in,
        description: p.description,
        required: p.required,
        schema: { type: p.type }
      }));
    }

    if (endpoint.requestBody) {
      pathItem.requestBody = {
        required: endpoint.requestBody.required?.length ? true : false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: endpoint.requestBody.properties
            },
            example: generateExample(endpoint.requestBody.properties)
          }
        }
      };
    }

    pathItem.responses = {};
    Object.entries(endpoint.responses).forEach(([code, response]) => {
      pathItem.responses[code] = {
        description: response.description,
        content: response.content
      };
    });

    paths[endpoint.path][endpoint.method.toLowerCase()] = pathItem;
  });

  const components: OpenAPISpec['components'] = {
    schemas: generateSchemas(endpoints)
  };

  if (options?.auth) {
    components.securitySchemes = {
      [options.auth.name || 'auth']: {
        type: options.auth.type,
        scheme: options.auth.type === 'bearer' ? 'bearer' : undefined,
        name: options.auth.type === 'apiKey' ? options.auth.name : undefined,
        in: options.auth.type === 'apiKey' ? 'header' : undefined
      }
    };
  }

  return {
    openapi: '3.0.0',
    info: {
      title: name,
      version,
      description: options?.description
    },
    servers: options?.baseUrl ? [{ url: options.baseUrl, description: options.serverDescription }] : undefined,
    paths,
    components,
    tags: extractTags(endpoints)
  };
}

function generateExample(properties: Record<string, APIProperty>): any {
  const example: any = {};
  Object.entries(properties).forEach(([key, prop]) => {
    example[key] = generateExampleValue(prop);
  });
  return example;
}

function generateExampleValue(prop: APIProperty): any {
  if (prop.default !== undefined) return prop.default;
  if (prop.enum?.length) return prop.enum[0];
  
  switch (prop.type) {
    case 'string':
      return 'example';
    case 'integer':
    case 'number':
      return 42;
    case 'boolean':
      return true;
    case 'array':
      return prop.items ? [generateExampleValue(prop.items)] : [];
    case 'object':
      return prop.properties ? generateExample(prop.properties) : {};
    default:
      return null;
  }
}

function generateSchemas(endpoints: APIEndpoint[]): Record<string, any> {
  const schemas: Record<string, any> = {};
  const schemaNames = new Set<string>();

  endpoints.forEach(endpoint => {
    if (endpoint.requestBody?.properties) {
      const schemaName = extractSchemaName(endpoint.path, endpoint.method);
      if (!schemaNames.has(schemaName)) {
        schemas[schemaName] = {
          type: 'object',
          properties: endpoint.requestBody.properties,
          required: endpoint.requestBody.required
        };
        schemaNames.add(schemaName);
      }
    }

    Object.values(endpoint.responses).forEach(response => {
      if (response.content?.['application/json']?.schema?.properties) {
        Object.entries(response.content['application/json'].schema.properties).forEach(([key, prop]: [string, any]) => {
          if (prop.$ref) {
            const refName = prop.$ref.replace('#/components/schemas/', '');
            if (!schemas[refName]) {
              schemas[refName] = { type: 'object', properties: {} };
            }
          }
        });
      }
    });
  });

  return schemas;
}

function extractSchemaName(path: string, method: string): string {
  const parts = path.split('/').filter(Boolean);
  const resource = parts[parts.length - 1] || 'Resource';
  return `${method}${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
}

function extractTags(endpoints: APIEndpoint[]): { name: string; description?: string }[] {
  const tagSet = new Set<string>();
  endpoints.forEach(e => e.tags?.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).map(name => ({ name }));
}

export function generateMarkdownDocs(spec: OpenAPISpec): string {
  let md = `# ${spec.info.title}\n\n`;
  md += `**Version:** ${spec.info.version}\n\n`;
  
  if (spec.info.description) {
    md += `${spec.info.description}\n\n`;
  }

  if (spec.servers?.length) {
    md += `## Base URL\n\n`;
    spec.servers.forEach(s => {
      md += `- ${s.url}${s.description ? ` (${s.description})` : ''}\n`;
    });
    md += '\n';
  }

  if (spec.tags?.length) {
    md += `## Tags\n\n`;
    spec.tags.forEach(t => {
      md += `- **${t.name}**${t.description ? `: ${t.description}` : ''}\n`;
    });
    md += '\n';
  }

  md += `## Endpoints\n\n`;
  
  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, details]: [string, any]) => {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        md += `### ${method.toUpperCase()} ${path}\n\n`;
        if (details.summary) md += `${details.summary}\n\n`;
        if (details.deprecated) md += `> **Deprecated**\n\n`;
        if (details.description) md += `${details.description}\n\n`;
        
        if (details.parameters?.length) {
          md += `#### Parameters\n\n`;
          md += `| Name | In | Type | Required | Description |\n`;
          md += `|------|-----|------|----------|-------------|\n`;
          details.parameters.forEach((p: any) => {
            md += `| ${p.name} | ${p.in} | ${p.schema?.type || 'string'} | ${p.required ? 'Yes' : 'No'} | ${p.description} |\n`;
          });
          md += '\n';
        }

        if (details.requestBody) {
          md += `#### Request Body\n\n`;
          if (details.requestBody.content?.['application/json']?.example) {
            md += '```json\n';
            md += JSON.stringify(details.requestBody.content['application/json'].example, null, 2);
            md += '\n```\n\n';
          }
        }

        if (details.responses) {
          md += `#### Responses\n\n`;
          Object.entries(details.responses).forEach(([code, resp]: [string, any]) => {
            md += `- **${code}**: ${resp.description}\n`;
          });
          md += '\n';
        }
      }
    });
  });

  return md;
}

export function generateTypeScriptClient(spec: OpenAPISpec): string {
  let ts = `// Auto-generated API Client\n`;
  ts += `// Version: ${spec.info.version}\n\n`;
  
  if (spec.components?.securitySchemes) {
    ts += `class AuthHandler {\n`;
    ts += `  private token: string;\n`;
    ts += `  constructor(token: string) { this.token = token; }\n`;
    ts += `  getHeaders() { return { Authorization: \`Bearer \${this.token}\` }; }\n`;
    ts += `}\n\n`;
    ts += `let auth: AuthHandler;\n`;
    ts += `export function setAuth(token: string) { auth = new AuthHandler(token); }\n\n`;
  }

  ts += `class APIClient {\n`;
  ts += `  private baseUrl: string;\n`;
  ts += `  constructor(baseUrl: string) { this.baseUrl = baseUrl; }\n\n`;

  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, details]: [string, any]) => {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        const funcName = generateFunctionName(path, method);
        ts += `  async ${funcName}(`;
        
        const params = details.parameters || [];
        const pathParams = params.filter((p: any) => p.in === 'path');
        const queryParams = params.filter((p: any) => p.in === 'query');
        
        const args: string[] = pathParams.map((p: any) => `${p.name}: string`);
        if (details.requestBody) args.push(`body?: object`);
        if (queryParams.length) args.push(`query?: object`);
        
        ts += args.join(', ');
        ts += `): Promise<any> {\n`;
        
        let url = `\`\${this.baseUrl}${path}\``;
        pathParams.forEach((p: any) => {
          url = url.replace(`{${p.name}}`, `\${${p.name}}`);
        });
        
        ts += `    const response = await fetch(${url}${queryParams.length ? ' + this.queryString(query)' : ''}, {\n`;
        ts += `      method: '${method.toUpperCase()}',\n`;
        ts += `      headers: {\n`;
        ts += `        'Content-Type': 'application/json',\n`;
        if (spec.components?.securitySchemes) ts += `        ...auth?.getHeaders(),\n`;
        ts += `      },\n`;
        if (details.requestBody) {
          ts += `      body: body ? JSON.stringify(body) : undefined,\n`;
        }
        ts += `    });\n`;
        ts += `    return response.json();\n`;
        ts += `  }\n\n`;
      }
    });
  });

  ts += `  private queryString(params: object): string {\n`;
  ts += `    const search = new URLSearchParams(params as any).toString();\n`;
  ts += `    return search ? \`?\${search}\` : '';\n`;
  ts += `  }\n`;
  ts += `}\n\n`;

  if (spec.servers?.length) {
    ts += `export const api = new APIClient('${spec.servers[0].url}');\n`;
  } else {
    ts += `export const api = new APIClient('');\n`;
  }

  return ts;
}

function generateFunctionName(path: string, method: string): string {
  const parts = path.split('/').filter(p => !p.startsWith(':') && p !== '');
  const resource = parts[parts.length - 1] || 'endpoint';
  return `${method}_${resource.replace(/[^a-zA-Z]/g, '_')}`;
}

export function validateOpenAPISpec(spec: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!spec.openapi?.startsWith('3.')) {
    errors.push('Must use OpenAPI 3.x');
  }

  if (!spec.info?.title) {
    errors.push('Missing info.title');
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No paths defined');
  }

  Object.entries(spec.paths || {}).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, details]: [string, any]) => {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        if (!details.responses) {
          errors.push(`${method.toUpperCase()} ${path}: Missing responses`);
        }
      }
    });
  });

  return { valid: errors.length === 0, errors };
}
