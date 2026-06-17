import { describe, it, expect } from 'vitest';
import { 
  generateOpenAPISpec,
  generateMarkdownDocs,
  generateTypeScriptClient,
  validateOpenAPISpec
} from './api-docs-generator';

describe('API Docs Generator', () => {
  const sampleEndpoints = [
    {
      path: '/users',
      method: 'GET' as const,
      description: 'Get all users',
      parameters: [
        { name: 'page', in: 'query' as const, description: 'Page number', type: 'integer' },
        { name: 'limit', in: 'query' as const, description: 'Items per page', type: 'integer' }
      ],
      responses: {
        '200': { description: 'List of users' }
      },
      tags: ['Users']
    },
    {
      path: '/users/{id}',
      method: 'GET' as const,
      description: 'Get user by ID',
      parameters: [
        { name: 'id', in: 'path' as const, description: 'User ID', required: true, type: 'string' }
      ],
      responses: {
        '200': { description: 'User object' },
        '404': { description: 'User not found' }
      },
      tags: ['Users']
    },
    {
      path: '/users',
      method: 'POST' as const,
      description: 'Create new user',
      requestBody: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
          email: { type: 'string', description: 'User email' }
        },
        required: ['name', 'email']
      },
      responses: {
        '201': { description: 'User created' }
      },
      tags: ['Users']
    }
  ];

  describe('generateOpenAPISpec', () => {
    it('should generate valid OpenAPI spec', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints);
      
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users']['get']).toBeDefined();
      expect(spec.paths['/users']['post']).toBeDefined();
    });

    it('should include server URL', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints, {
        baseUrl: 'https://api.example.com'
      });
      
      expect(spec.servers).toBeDefined();
      expect(spec.servers![0].url).toBe('https://api.example.com');
    });

    it('should handle auth configuration', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints, {
        auth: { type: 'bearer' }
      });
      
      expect(spec.components?.securitySchemes).toBeDefined();
    });
  });

  describe('generateMarkdownDocs', () => {
    it('should generate markdown documentation', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints);
      const md = generateMarkdownDocs(spec);
      
      expect(md).toContain('# Test API');
      expect(md).toContain('**Version:** 1.0.0');
      expect(md).toContain('GET /users');
      expect(md).toContain('POST /users');
      expect(md).toContain('### Parameters');
    });

    it('should include parameter tables', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints);
      const md = generateMarkdownDocs(spec);
      
      expect(md).toContain('| Name | In | Type |');
      expect(md).toContain('page');
      expect(md).toContain('query');
    });
  });

  describe('generateTypeScriptClient', () => {
    it('should generate TypeScript client code', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints, {
        baseUrl: 'https://api.example.com'
      });
      const ts = generateTypeScriptClient(spec);
      
      expect(ts).toContain('class APIClient');
      expect(ts).toContain('async get_users');
      expect(ts).toContain('async post_users');
      expect(ts).toContain('https://api.example.com');
    });

    it('should include auth handler when configured', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints, {
        auth: { type: 'bearer' }
      });
      const ts = generateTypeScriptClient(spec);
      
      expect(ts).toContain('class AuthHandler');
      expect(ts).toContain('setAuth');
    });
  });

  describe('validateOpenAPISpec', () => {
    it('should validate correct spec', () => {
      const spec = generateOpenAPISpec('Test API', '1.0.0', sampleEndpoints);
      const result = validateOpenAPISpec(spec);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid spec', () => {
      const result = validateOpenAPISpec({ info: {} });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
