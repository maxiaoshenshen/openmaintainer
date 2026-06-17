/**
 * Semantic Search - AI-powered search across issues, PRs, and documentation
 */

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights: string[];
  reason: string;
}

export interface SearchIndex<T> {
  id: string;
  content: string;
  metadata: T;
  embeddings?: number[];
}

/**
 * Generate embeddings for text (simplified implementation)
 */
export function generateEmbeddings(text: string): number[] {
  // Simplified embedding generation - in production, use OpenAI/Cohere/etc
  const words = text.toLowerCase().split(/\s+/);
  const embeddings = new Array(128).fill(0);
  
  words.forEach((word, i) => {
    const hash = hashString(word);
    for (let j = 0; j < 4; j++) {
      embeddings[(hash + i + j) % 128] += Math.sin(hash * (j + 1)) * 0.1;
    }
  });
  
  // Normalize
  const norm = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
  return embeddings.map(v => v / (norm || 1));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Search with semantic understanding
 */
export function semanticSearch<T extends { id: string | number; title?: string; body?: string; content?: string }>(
  query: string,
  items: T[],
  options: {
    limit?: number;
    threshold?: number;
    fields?: (keyof T)[];
  } = {}
): SearchResult<T>[] {
  const { limit = 10, threshold = 0.3, fields = ['title', 'body', 'content'] } = options;
  
  const queryEmbeddings = generateEmbeddings(query);
  
  const results: SearchResult<T>[] = items.map(item => {
    // Combine relevant fields
    const content = fields
      .map(field => String(item[field] || ''))
      .join(' ');
    
    const itemEmbeddings = generateEmbeddings(content);
    const score = cosineSimilarity(queryEmbeddings, itemEmbeddings);
    
    // Generate highlights
    const highlights = extractHighlights(query, content);
    
    return {
      item,
      score,
      highlights,
      reason: generateReason(query, content, score),
    };
  });
  
  return results
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function extractHighlights(query: string, content: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const highlights: string[] = [];
  
  for (const word of words) {
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(word) && highlights.length < 3) {
        const trimmed = sentence.trim().slice(0, 150);
        highlights.push(trimmed + (sentence.length > 150 ? '...' : ''));
      }
    }
  }
  
  return highlights.slice(0, 3);
}

function generateReason(query: string, content: string, score: number): string {
  const words = query.toLowerCase().split(/\s+/);
  const matched = words.filter(w => content.toLowerCase().includes(w)).length;
  
  if (score > 0.8) return `Strong semantic match (${Math.round(score * 100)}%)`;
  if (score > 0.5) return `Good match with ${matched}/${words.length} query terms`;
  if (matched > 0) return `Partial match: ${matched}/${words.length} terms found`;
  return 'Semantic similarity match';
}

/**
 * Build search index for faster queries
 */
export class SearchIndexBuilder<T> {
  private items: SearchIndex<T>[] = [];
  
  add(item: T, content: string, id: string): void {
    this.items.push({
      id,
      content,
      metadata: item,
      embeddings: generateEmbeddings(content),
    });
  }
  
  build(): SearchIndex<T>[] {
    return this.items;
  }
}

/**
 * Search from pre-built index
 */
export function searchIndex<T>(
  query: string,
  index: SearchIndex<T>[],
  limit = 10
): SearchResult<T>[] {
  const queryEmbeddings = generateEmbeddings(query);
  
  return index
    .map(item => ({
      item: item.metadata,
      score: cosineSimilarity(queryEmbeddings, item.embeddings || []),
      highlights: extractHighlights(query, item.content),
      reason: '',
    }))
    .filter(r => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({ ...r, reason: generateReason(query, '', r.score) }));
}

/**
 * Autocomplete suggestions
 */
export function getAutocompleteSuggestions(
  partial: string,
  items: { title: string; id: string }[],
  limit = 5
): { text: string; id: string }[] {
  const lower = partial.toLowerCase();
  
  return items
    .filter(item => item.title.toLowerCase().includes(lower))
    .map(item => ({ text: item.title, id: item.id }))
    .slice(0, limit);
}
