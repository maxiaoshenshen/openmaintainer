import { describe, it, expect } from 'vitest';
import { APIDocBuilder } from './api-doc-builder';

describe('APIDocBuilder', () => {
  it('should create API documentation', () => {
    const doc = new APIDocBuilder('Test API', '1.0.0', 'https://api.example.com')
      .setDescription('A test API')
      .addTag('users', 'User management')
      .addSchema({ name: 'User', type: 'object', properties: { id: { name: 'id', type: 'string' }, name: { name: 'name', type: 'string' } }, required: ['id'] })
      .get('/users', 'List all users')
        .tags(['users'])
        .responses([{ statusCode: 200, description: 'Success' }])
      .post('/users', 'Create a user')
        .tags(['users'])
        .describe('Create a new user')
        .params([{ name: 'name', in: 'body', type: 'string', required: true }])
        .responses([{ statusCode: 201, description: 'Created' }])
      .build();

    expect(doc.title).toBe('Test API');
    expect(doc.endpoints).toHaveLength(2);
  });

  it('should generate JSON', () => {
    const doc = new APIDocBuilder('API', '1.0', 'https://api.test.com')
      .get('/test', 'Test endpoint')
        .responses([{ statusCode: 200, description: 'OK' }])
      .build();
    const json = doc.toJSON();
    expect(json).toContain('Test endpoint');
  });

  it('should generate Markdown', () => {
    const doc = new APIDocBuilder('API', '1.0', 'https://api.test.com')
      .addTag('test', 'Test endpoints')
      .get('/test', 'Test endpoint')
        .tags(['test'])
        .responses([{ statusCode: 200, description: 'OK' }])
      .build();
    const md = doc.toMarkdown();
    expect(md).toContain('## Endpoints');
    expect(md).toContain('GET /test');
  });
});
