/**
 * CODEOWNERS Checker - Validate and manage CODEOWNERS file
 */

export interface CodeOwner {
  pattern: string;
  owners: string[];
  line: number;
}

export interface CodeOwnerValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ReviewCoverage {
  pattern: string;
  covered: boolean;
  owners: string[];
  missingOwners: string[];
}

/**
 * Parse CODEOWNERS file
 */
export function parseCodeOwners(content: string): CodeOwner[] {
  const lines = content.split('\n');
  const owners: CodeOwner[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      owners.push({
        pattern: parts[0],
        owners: parts.slice(1),
        line: index + 1
      });
    }
  });

  return owners;
}

/**
 * Validate CODEOWNERS syntax
 */
export function validateCodeOwners(content: string): CodeOwnerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (!trimmed.includes('@')) {
      errors.push(`Line ${index + 1}: Pattern must have at least one owner`);
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      errors.push(`Line ${index + 1}: Missing owners for pattern "${parts[0]}"`);
    }

    if (parts[0].includes('@')) {
      errors.push(`Line ${index + 1}: Pattern cannot start with @`);
    }
  });

  const owners = parseCodeOwners(content);
  const patterns = owners.map(o => o.pattern);
  const duplicates = patterns.filter((p, i) => patterns.indexOf(p) !== i);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate patterns: ${[...new Set(duplicates)].join(', ')}`);
  }

  const rootPattern = owners.find(o => o.pattern === '*');
  if (!rootPattern) {
    warnings.push('Missing root pattern (*) - not all files have owners');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check coverage for a file
 */
export function checkFileCoverage(
  filePath: string,
  owners: CodeOwner[]
): ReviewCoverage {
  const matchingOwners = owners
    .filter(o => matchPattern(filePath, o.pattern))
    .sort((a, b) => b.pattern.length - a.pattern.length);

  const bestMatch = matchingOwners[0];

  if (!bestMatch) {
    return {
      pattern: '',
      covered: false,
      owners: [],
      missingOwners: ['@global-maintainers']
    };
  }

  return {
    pattern: bestMatch.pattern,
    covered: true,
    owners: bestMatch.owners,
    missingOwners: []
  };
}

function matchPattern(filePath: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/')) {
    return filePath.startsWith(pattern.slice(0, -1)) || filePath.includes(pattern);
  }
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(filePath);
  }
  return filePath.includes(pattern);
}

/**
 * Get all unmatched files
 */
export function findUncoveredFiles(
  files: string[],
  owners: CodeOwner[]
): string[] {
  return files.filter(file => !checkFileCoverage(file, owners).covered);
}

/**
 * Generate CODEOWNERS suggestions
 */
export function suggestCodeOwners(
  files: string[],
  existingOwners: CodeOwner[]
): { pattern: string; suggestion: string }[] {
  const suggestions: { pattern: string; suggestion: string }[] = [];
  
  const byDirectory = new Map<string, string[]>();
  files.forEach(file => {
    const dir = file.split('/')[0];
    if (!byDirectory.has(dir)) byDirectory.set(dir, []);
    byDirectory.get(dir)!.push(file);
  });

  byDirectory.forEach((files, dir) => {
    const existing = existingOwners.find(o => o.pattern.startsWith(dir));
    if (!existing && files.length > 5) {
      suggestions.push({
        pattern: `${dir}/`,
        suggestion: `Add @maintainers for ${files.length} files in ${dir}/`
      });
    }
  });

  return suggestions;
}
