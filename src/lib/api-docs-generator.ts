/**
 * API Documentation Generator - Auto-generate API docs from code
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: string;
  example?: string;
}

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: {
    description?: string;
    schema?: string;
    example?: any;
  };
  responses: {
    status: number;
    description: string;
    schema?: string;
    example?: any;
  }[];
  tags?: string[];
  deprecated?: boolean;
}

export interface ApiDoc {
  title: string;
  version: string;
  description?: string;
  baseUrl?: string;
  endpoints: ApiEndpoint[];
  schemas?: Record<string, SchemaDefinition>;
}

export interface SchemaDefinition {
  name: string;
  type: "object" | "array" | "string" | "number" | "boolean" | "enum";
  properties?: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
    example?: any;
  }[];
  enumValues?: string[];
  example?: any;
}

const STATUS_CODE_DESCRIPTIONS: Record<number, string> = {
  200: "OK - Request succeeded",
  201: "Created - Resource created successfully",
  204: "No Content - Request succeeded with no response body",
  400: "Bad Request - Invalid request parameters",
  401: "Unauthorized - Authentication required",
  403: "Forbidden - Insufficient permissions",
  404: "Not Found - Resource not found",
  422: "Unprocessable Entity - Validation failed",
  429: "Too Many Requests - Rate limit exceeded",
  500: "Internal Server Error - Unexpected server error",
};

/**
 * Create API documentation
 */
export function createApiDoc(
  title: string,
  version: string,
  options?: { description?: string; baseUrl?: string }
): ApiDoc {
  return {
    title,
    version,
    description: options?.description,
    baseUrl: options?.baseUrl,
    endpoints: [],
    schemas: {},
  };
}

/**
 * Add endpoint to documentation
 */
export function addEndpoint(
  doc: ApiDoc,
  endpoint: Omit<ApiEndpoint, "responses"> & { responses?: ApiEndpoint["responses"] }
): ApiDoc {
  const fullEndpoint: ApiEndpoint = {
    ...endpoint,
    responses: endpoint.responses || [
      { status: 200, description: "Success" },
    ],
  };
  doc.endpoints.push(fullEndpoint);
  return doc;
}

/**
 * Add schema definition
 */
export function addSchema(
  doc: ApiDoc,
  schema: SchemaDefinition
): ApiDoc {
  if (!doc.schemas) doc.schemas = {};
  doc.schemas[schema.name] = schema;
  return doc;
}

/**
 * Generate OpenAPI 3.0 JSON
 */
export function generateOpenApi(doc: ApiDoc): object {
  const paths: Record<string, Record<string, object>> = {};

  for (const endpoint of doc.endpoints) {
    const pathEntry = paths[endpoint.path] || {};
    
    pathEntry[endpoint.method.toLowerCase()] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      deprecated: endpoint.deprecated,
      parameters: endpoint.parameters?.map(p => ({
        name: p.name,
        in: "path",
        required: p.required,
        description: p.description,
        schema: { type: p.type },
        example: p.example,
      })),
      requestBody: endpoint.requestBody ? {
        description: endpoint.requestBody.description,
        content: {
          "application/json": {
            schema: endpoint.requestBody.schema ? 
              { $ref: `#/components/schemas/${endpoint.requestBody.schema}` } :
              { type: "object" },
            example: endpoint.requestBody.example,
          },
        },
      } : undefined,
      responses: Object.fromEntries(
        endpoint.responses.map(r => [
          r.status.toString(),
          {
            description: r.description,
            content: r.schema ? {
              "application/json": {
                schema: { $ref: `#/components/schemas/${r.schema}` },
                example: r.example,
              },
            } : undefined,
          },
        ])
      ),
    };

    paths[endpoint.path] = pathEntry;
  }

  return {
    openapi: "3.0.0",
    info: {
      title: doc.title,
      version: doc.version,
      description: doc.description,
    },
    servers: doc.baseUrl ? [{ url: doc.baseUrl }] : [],
    paths,
    components: doc.schemas ? {
      schemas: Object.fromEntries(
        Object.entries(doc.schemas).map(([name, schema]) => [
          name,
          {
            type: schema.type,
            properties: schema.properties ? Object.fromEntries(
              schema.properties.map(p => [
                p.name,
                { 
                  type: p.type, 
                  description: p.description,
                  example: p.example,
                },
              ])
            ) : undefined,
            enum: schema.enumValues,
            example: schema.example,
          },
        ])
      ),
    } : undefined,
  };
}

/**
 * Generate markdown documentation
 */
export function generateMarkdown(doc: ApiDoc): string {
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);
  lines.push("");
  lines.push(`**Version:** ${doc.version}`);
  lines.push("");

  if (doc.description) {
    lines.push(doc.description);
    lines.push("");
  }

  if (doc.baseUrl) {
    lines.push(`**Base URL:** ${doc.baseUrl}`);
    lines.push("");
  }

  // Table of contents
  lines.push("## Table of Contents");
  lines.push("");

  const tags = new Set<string>();
  for (const endpoint of doc.endpoints) {
    if (endpoint.tags) {
      endpoint.tags.forEach(t => tags.add(t));
    }
  }

  for (const tag of tags) {
    lines.push(`- [${tag}](#${tag.toLowerCase().replace(/\s+/g, "-")})`);
  }
  lines.push("");

  // Group by tags
  const byTag = new Map<string, ApiEndpoint[]>();
  for (const endpoint of doc.endpoints) {
    const tag = endpoint.tags?.[0] || "General";
    const list = byTag.get(tag) || [];
    list.push(endpoint);
    byTag.set(tag, list);
  }

  for (const [tag, endpoints] of byTag) {
    lines.push(`## ${tag}`);
    lines.push("");

    for (const endpoint of endpoints) {
      lines.push(`### ${endpoint.method} ${endpoint.path}`);
      lines.push("");

      if (endpoint.deprecated) {
        lines.push("> **DEPRECATED**");
        lines.push("");
      }

      if (endpoint.summary) {
        lines.push(`**${endpoint.summary}**`);
        lines.push("");
      }

      if (endpoint.description) {
        lines.push(endpoint.description);
        lines.push("");
      }

      if (endpoint.parameters && endpoint.parameters.length > 0) {
        lines.push("#### Parameters");
        lines.push("");
        lines.push("| Name | Type | Required | Description |");
        lines.push("|------|------|----------|-------------|");
        for (const p of endpoint.parameters) {
          lines.push(`| ${p.name} | ${p.type} | ${p.required ? "Yes" : "No"} | ${p.description || ""} |`);
        }
        lines.push("");
      }

      if (endpoint.requestBody) {
        lines.push("#### Request Body");
        lines.push("");
        if (endpoint.requestBody.description) {
          lines.push(endpoint.requestBody.description);
          lines.push("");
        }
        if (endpoint.requestBody.schema) {
          lines.push(`Schema: \`${endpoint.requestBody.schema}\``);
          lines.push("");
        }
      }

      lines.push("#### Responses");
      lines.push("");
      lines.push("| Status | Description |");
      lines.push("|--------|-------------|");
      for (const r of endpoint.responses) {
        lines.push(`| ${r.status} | ${r.description} |`);
      }
      lines.push("");

      lines.push("---");
      lines.push("");
    }
  }

  // Schemas
  if (doc.schemas && Object.keys(doc.schemas).length > 0) {
    lines.push("## Schemas");
    lines.push("");

    for (const [name, schema] of Object.entries(doc.schemas)) {
      lines.push(`### ${name}`);
      lines.push("");
      lines.push(`**Type:** ${schema.type}`);
      lines.push("");

      if (schema.enumValues) {
        lines.push(`**Enum:** \`${schema.enumValues.join(" | ")}\``);
        lines.push("");
      }

      if (schema.properties && schema.properties.length > 0) {
        lines.push("| Property | Type | Description |");
        lines.push("|----------|------|-------------|");
        for (const p of schema.properties) {
          lines.push(`| ${p.name} | ${p.type} | ${p.description || ""} |`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n").trim();
}

/**
 * Generate Postman collection
 */
export function generatePostmanCollection(doc: ApiDoc): object {
  return {
    info: {
      name: doc.title,
      description: doc.description,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: doc.baseUrl ? [{
      key: "baseUrl",
      value: doc.baseUrl,
    }] : [],
    item: doc.endpoints.map(endpoint => ({
      name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        header: [],
        url: {
          raw: `{{baseUrl}}${endpoint.path}`,
          host: ["{{baseUrl}}"],
          path: endpoint.path.split("/").filter(Boolean),
        },
        description: endpoint.description,
      },
      response: endpoint.responses.map(r => ({
        name: `${r.status} - ${r.description}`,
        status: r.status.toString(),
        code: r.status,
        body: r.example ? JSON.stringify(r.example, null, 2) : "",
      })),
    })),
  };
}

/**
 * Validate API documentation
 */
export function validateApiDoc(doc: ApiDoc): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!doc.title) {
    errors.push("API documentation must have a title");
  }

  if (!doc.version) {
    errors.push("API documentation must have a version");
  }

  const paths = new Set<string>();
  const methods = new Set<string>();

  for (const endpoint of doc.endpoints) {
    if (!endpoint.method) {
      errors.push(`Endpoint ${paths.size + 1} missing HTTP method`);
    }

    if (!endpoint.path) {
      errors.push(`Endpoint ${paths.size + 1} missing path`);
    } else if (!endpoint.path.startsWith("/")) {
      errors.push(`Endpoint path must start with /: ${endpoint.path}`);
    }

    if (endpoint.responses.length === 0) {
      errors.push(`Endpoint ${endpoint.method} ${endpoint.path} has no responses defined`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get status description
 */
export function getStatusDescription(status: number): string {
  return STATUS_CODE_DESCRIPTIONS[status] || `${status} Response`;
}
