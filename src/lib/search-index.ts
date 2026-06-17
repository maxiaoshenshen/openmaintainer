/**
 * Search Index - Full-text search for maintainer content
 */

export interface SearchDocument {
  id: string;
  type: "issue" | "pr" | "release" | "doc" | "comment";
  title: string;
  body: string;
  metadata: Record<string, any>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights: {
    field: string;
    snippets: string[];
  }[];
}

export interface SearchQuery {
  query: string;
  filters?: {
    type?: SearchDocument["type"] | SearchDocument["type"][];
    tags?: string[];
    dateRange?: { start: string; end: string };
  };
  pagination?: { page: number; perPage: number };
  sort?: "relevance" | "date" | "score";
}

export class SearchIndex {
  private documents: Map<string, SearchDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();

  addDocument(doc: SearchDocument) {
    this.documents.set(doc.id, doc);
    this.indexDocument(doc);
  }

  private indexDocument(doc: SearchDocument) {
    const words = this.tokenize(doc.title + " " + doc.body);
    for (const word of words) {
      if (!this.invertedIndex.has(word)) {
        this.invertedIndex.set(word, new Set());
      }
      this.invertedIndex.get(word)!.add(doc.id);
    }
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  search(query: SearchQuery): { results: SearchResult[]; total: number } {
    const tokens = this.tokenize(query.query);
    const scoredDocs = new Map<string, number>();
    
    for (const token of tokens) {
      const docIds = this.invertedIndex.get(token);
      if (docIds) {
        for (const id of docIds) {
          scoredDocs.set(id, (scoredDocs.get(id) || 0) + 1);
        }
      }
    }

    let results: SearchResult[] = [];
    for (const [docId, score] of scoredDocs) {
      const doc = this.documents.get(docId)!;
      if (this.matchesFilters(doc, query.filters)) {
        results.push({
          document: doc,
          score: score / tokens.length,
          highlights: this.generateHighlights(doc, tokens),
        });
      }
    }

    // Sort
    if (query.sort === "date") {
      results.sort((a, b) => new Date(b.document.updatedAt).getTime() - new Date(a.document.updatedAt).getTime());
    } else if (query.sort === "score" || !query.sort) {
      results.sort((a, b) => b.score - a.score);
    }

    const total = results.length;
    const { page = 1, perPage = 20 } = query.pagination || {};
    results = results.slice((page - 1) * perPage, page * perPage);

    return { results, total };
  }

  private matchesFilters(doc: SearchDocument, filters?: SearchQuery["filters"]): boolean {
    if (!filters) return true;
    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      if (!types.includes(doc.type)) return false;
    }
    if (filters.tags?.length) {
      if (!filters.tags.some(t => doc.tags.includes(t))) return false;
    }
    if (filters.dateRange) {
      const date = new Date(doc.updatedAt);
      if (date < new Date(filters.dateRange.start) || date > new Date(filters.dateRange.end)) return false;
    }
    return true;
  }

  private generateHighlights(doc: SearchDocument, tokens: string[]): SearchResult["highlights"] {
    const highlights: SearchResult["highlights"] = [];
    for (const field of ["title", "body"] as const) {
      const text = doc[field];
      const snippets: string[] = [];
      for (const token of tokens) {
        const idx = text.toLowerCase().indexOf(token);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(text.length, idx + token.length + 30);
          snippets.push("..." + text.slice(start, end) + "...");
        }
      }
      if (snippets.length > 0) {
        highlights.push({ field, snippets });
      }
    }
    return highlights;
  }

  deleteDocument(id: string) {
    this.documents.delete(id);
  }

  getStats() {
    return {
      totalDocs: this.documents.size,
      indexedTerms: this.invertedIndex.size,
    };
  }
}
