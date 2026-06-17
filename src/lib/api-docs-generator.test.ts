import { describe, it, expect } from "vitest";
import {
  createApiDoc,
  addEndpoint,
  addSchema,
  generateOpenApi,
  generateMarkdown,
  generatePostmanCollection,
  validateApiDoc,
  getStatusDescription,
  type ApiDoc,
} from "./api-docs-generator";

describe("ApiDocsGenerator", () => {
  describe("createApiDoc", () => {
    it("should create API doc with defaults", () => {
      const doc = createApiDoc("Test API", "1.0.0", {
        description: "A test API",
        baseUrl: "https://api.example.com",
      });
      
      expect(doc.title).toBe("Test API");
      expect(doc.version).toBe("1.0.0");
      expect(doc.description).toBe("A test API");
      expect(doc.baseUrl).toBe("https://api.example.com");
      expect(doc.endpoints).toEqual([]);
    });
  });

  describe("addEndpoint", () => {
    it("should add endpoint to documentation", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/users",
        summary: "Get all users",
        responses: [{ status: 200, description: "List of users" }],
      });
      
      expect(doc.endpoints.length).toBe(1);
      expect(doc.endpoints[0].method).toBe("GET");
      expect(doc.endpoints[0].path).toBe("/users");
    });

    it("should add parameters to endpoint", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/users/:id",
        parameters: [
          { name: "id", type: "string", required: true, description: "User ID" },
        ],
        responses: [{ status: 200, description: "User" }],
      });
      
      expect(doc.endpoints[0].parameters?.length).toBe(1);
      expect(doc.endpoints[0].parameters?.[0].name).toBe("id");
    });
  });

  describe("addSchema", () => {
    it("should add schema to documentation", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addSchema(doc, {
        name: "User",
        type: "object",
        properties: [
          { name: "id", type: "string", required: true },
          { name: "name", type: "string", description: "User name" },
        ],
      });
      
      expect(doc.schemas?.User).toBeDefined();
      expect(doc.schemas?.User.properties?.length).toBe(2);
    });
  });

  describe("generateOpenApi", () => {
    it("should generate OpenAPI 3.0 spec", () => {
      let doc = createApiDoc("Test API", "1.0.0", { baseUrl: "https://api.test.com" });
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/items",
        summary: "Get items",
        responses: [{ status: 200, description: "Items list" }],
      });
      
      const spec = generateOpenApi(doc) as any;
      
      expect(spec.openapi).toBe("3.0.0");
      expect(spec.info.title).toBe("Test API");
      expect(spec.paths["/items"].get.summary).toBe("Get items");
    });

    it("should include schemas", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addSchema(doc, {
        name: "Item",
        type: "object",
        properties: [{ name: "id", type: "string" }],
      });
      
      const spec = generateOpenApi(doc) as any;
      expect(spec.components?.schemas?.Item).toBeDefined();
    });
  });

  describe("generateMarkdown", () => {
    it("should generate markdown documentation", () => {
      let doc = createApiDoc("Test API", "1.0.0");
      doc = addEndpoint(doc, {
        method: "POST",
        path: "/users",
        summary: "Create user",
        description: "Create a new user account",
        tags: ["Users"],
        responses: [
          { status: 201, description: "User created" },
          { status: 400, description: "Invalid input" },
        ],
      });
      
      const md = generateMarkdown(doc);
      
      expect(md).toContain("# Test API");
      expect(md).toContain("**Version:** 1.0.0");
      expect(md).toContain("## Users");
      expect(md).toContain("### POST /users");
      expect(md).toContain("**Create user**");
      expect(md).toContain("201");
      expect(md).toContain("400");
    });

    it("should include table of contents", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/test",
        tags: ["Test"],
        responses: [{ status: 200, description: "OK" }],
      });
      
      const md = generateMarkdown(doc);
      expect(md).toContain("## Table of Contents");
      expect(md).toContain("Test");
    });
  });

  describe("generatePostmanCollection", () => {
    it("should generate Postman collection", () => {
      let doc = createApiDoc("Test API", "1.0.0", { baseUrl: "https://api.test.com" });
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/items",
        responses: [{ status: 200, description: "Success" }],
      });
      
      const collection = generatePostmanCollection(doc) as any;
      
      expect(collection.info.name).toBe("Test API");
      expect(collection.item.length).toBe(1);
      expect(collection.item[0].request.method).toBe("GET");
      expect(collection.variable[0].key).toBe("baseUrl");
    });
  });

  describe("validateApiDoc", () => {
    it("should pass for valid documentation", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/test",
        responses: [{ status: 200, description: "OK" }],
      });
      
      const validation = validateApiDoc(doc);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it("should fail for missing path", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addEndpoint(doc, {
        method: "GET",
        path: "",
        responses: [{ status: 200, description: "OK" }],
      } as any);
      
      const validation = validateApiDoc(doc);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should fail for missing responses", () => {
      let doc = createApiDoc("Test", "1.0.0");
      doc = addEndpoint(doc, {
        method: "GET",
        path: "/test",
        responses: [],
      } as any);
      
      const validation = validateApiDoc(doc);
      expect(validation.valid).toBe(false);
    });
  });

  describe("getStatusDescription", () => {
    it("should return description for known status codes", () => {
      expect(getStatusDescription(200)).toContain("OK");
      expect(getStatusDescription(201)).toContain("Created");
      expect(getStatusDescription(400)).toContain("Bad Request");
      expect(getStatusDescription(404)).toContain("Not Found");
      expect(getStatusDescription(500)).toContain("Internal Server Error");
    });

    it("should return generic description for unknown codes", () => {
      expect(getStatusDescription(599)).toContain("599");
    });
  });
});
