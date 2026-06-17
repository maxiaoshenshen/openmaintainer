import { describe, it, expect } from 'vitest';
import {
  generateOpenAPISpec,
  generateMarkdownDoc,
  generatePostmanCollection,
  parseJSDocAPI,
  generateTypeDefinitions,
} from './api-generator';

describe('API Generator', () => {
  const sampleEndpoint = {
    method: 'GET' as const,
    path: '/repos/{owner}/{repo}',
    summary: 'Get repository',
    description: 'Get details of a repository',
    parameters: [
      { name: 'owner', in: 'path' as const, required: true, type: 'string' },
      { name: 'repo', in: 'path' as const, required: true, type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Repository details' },
      { statusCode: 404, description: 'Not found' },
    ],
    tags: ['Repositories'],
  };

  const sampleDoc = {
    title: 'Test API',
    version: '1.0.0',
    description: 'A test API',
    baseUrl: 'https://api.example.com',
    endpoints: [sampleEndpoint],
    tags: ['Repositories'],
  };

  describe('generateOpenAPISpec', () => {
    it('should generate valid OpenAPI 3.0 spec', () => {
      const spec = generateOpenAPISpec(sampleDoc);

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toEqual({
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API',
      });
      expect(spec.servers).toEqual([{ url: 'https://api.example.com' }]);
    });

    it('should include paths', () => {
      const spec = generateOpenAPISpec(sampleDoc);
      const paths = spec.paths as Record<string, unknown>;

      expect(paths['/repos/{owner}/{repo}']).toBeDefined();
    });
  });

  describe('generateMarkdownDoc', () => {
    it('should generate markdown documentation', () => {
      const md = generateMarkdownDoc(sampleDoc);

      expect(md).toContain('# Test API');
      expect(md).toContain('**Version:** 1.0.0');
      expect(md).toContain('GET /repos/{owner}/{repo}');
    });

    it('should include parameters table', () => {
      const md = generateMarkdownDoc(sampleDoc);

      expect(md).toContain('| Name | In | Type |');
      expect(md).toContain('owner');
      expect(md).toContain('path');
    });

    it('should group by tags', () => {
      const md = generateMarkdownDoc(sampleDoc);

      expect(md).toContain('## Repositories');
    });

    it('should mark deprecated endpoints', () => {
      const doc = {
        ...sampleDoc,
        endpoints: [{ ...sampleEndpoint, deprecated: true }],
      };

      const md = generateMarkdownDoc(doc);
      expect(md).toContain('**Deprecated**');
    });
  });

  describe('generatePostmanCollection', () => {
    it('should generate Postman collection format', () => {
      const collection = generatePostmanCollection(sampleDoc);

      expect(collection.info).toBeDefined();
      expect(collection.info.name).toBe('Test API');
      expect(Array.isArray(collection.item)).toBe(true);
    });

    it('should include request details', () => {
      const collection = generatePostmanCollection(sampleDoc);
      const item = (collection.item as unknown[])[0] as { request: { method: string; url: { raw: string } } };

      expect(item.request.method).toBe('GET');
      expect(item.request.url.raw).toContain('/repos/{owner}/{repo}');
    });
  });

  describe('parseJSDocAPI', () => {
    it('should parse JSDoc comments', () => {
      const comment = `
        * @title My API
        * @version 2.0.0
        * @description A great API
        * @baseUrl https://api.example.com
      `;

      const result = parseJSDocAPI(comment);

      expect(result.title).toBe('My API');
      expect(result.version).toBe('2.0.0');
      expect(result.description).toBe('A great API');
      expect(result.baseUrl).toBe('https://api.example.com');
    });
  });

  describe('generateTypeDefinitions', () => {
    it('should generate TypeScript types', () => {
      const doc = {
        ...sampleDoc,
        endpoints: [{
          ...sampleEndpoint,
          requestBody: {
            required: true,
            contentType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Repository name' },
              },
            },
          },
        }],
      };

      const types = generateTypeDefinitions(doc);

      expect(types).toContain('export interface');
      expect(types).toContain('name: string');
    });
  });
});
