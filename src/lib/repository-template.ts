export type TemplateLanguage = 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'java' | 'csharp';

export type TemplateFramework = 'node' | 'react' | 'next' | 'vue' | 'angular' | 'django' | 'flask' | 'fastapi' | 'none';

export type LicenseType = 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'BSD-3-Clause' | 'ISC' | 'Unlicense';

export interface TemplateConfig {
  name: string;
  description: string;
  language: TemplateLanguage;
  framework?: TemplateFramework;
  license: LicenseType;
  includeTests: boolean;
  includeCI: boolean;
  includeDocker: boolean;
  includeDocs: boolean;
  includeESLint: boolean;
  includePrettier: boolean;
  includeGitHooks: boolean;
  includeCHANGELOG: boolean;
  includeContributing: boolean;
  includeBadges: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export interface RepositoryTemplate {
  id: string;
  config: TemplateConfig;
  files: GeneratedFile[];
  createdAt: Date;
}

export class RepositoryTemplateManager {
  private templates: Map<string, RepositoryTemplate> = new Map();

  async createTemplate(config: TemplateConfig): Promise<RepositoryTemplate> {
    const id = `TPL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const files = await this.generateFiles(config);

    const template: RepositoryTemplate = {
      id,
      config,
      files,
      createdAt: new Date(),
    };

    this.templates.set(id, template);
    return template;
  }

  private async generateFiles(config: TemplateConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const ext = this.getExtension(config.language);

    // README
    files.push({
      path: 'README.md',
      content: this.generateReadme(config),
      description: 'Main documentation file',
    });

    // package.json for Node projects
    if (config.language === 'typescript' || config.language === 'javascript') {
      files.push({
        path: 'package.json',
        content: this.generatePackageJson(config),
        description: 'Node.js project configuration',
      });
    }

    // tsconfig.json for TypeScript
    if (config.language === 'typescript') {
      files.push({
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules'],
        }, null, 2),
        description: 'TypeScript configuration',
      });
    }

    // Main source file
    files.push({
      path: `src/index${ext}`,
      content: this.generateMainSource(config),
      description: 'Main entry point',
    });

    // Test file
    if (config.includeTests) {
      files.push({
        path: `src/index.test${ext}`,
        content: this.generateTestFile(config),
        description: 'Unit tests',
      });
    }

    // .gitignore
    files.push({
      path: '.gitignore',
      content: this.generateGitignore(config),
      description: 'Git ignore rules',
    });

    // LICENSE
    files.push({
      path: 'LICENSE',
      content: this.generateLicense(config.license),
      description: `${config.license} license`,
    });

    // CI/CD
    if (config.includeCI) {
      files.push({
        path: '.github/workflows/ci.yml',
        content: this.generateCIWorkflow(config),
        description: 'GitHub Actions CI workflow',
      });
    }

    // Docker
    if (config.includeDocker) {
      files.push({
        path: 'Dockerfile',
        content: this.generateDockerfile(config),
        description: 'Docker configuration',
      });
    }

    // Contributing guide
    if (config.includeContributing) {
      files.push({
        path: 'CONTRIBUTING.md',
        content: this.generateContributing(config),
        description: 'Contribution guidelines',
      });
    }

    // CHANGELOG
    if (config.includeCHANGELOG) {
      files.push({
        path: 'CHANGELOG.md',
        content: '# Changelog\n\n## [Unreleased]\n\n### Added\n- Initial release\n',
        description: 'Version history',
      });
    }

    // ESLint
    if (config.includeESLint && (config.language === 'typescript' || config.language === 'javascript')) {
      files.push({
        path: '.eslintrc.json',
        content: JSON.stringify({
          extends: config.language === 'typescript' 
            ? ['eslint:recommended', 'plugin:@typescript-eslint/recommended']
            : ['eslint:recommended'],
          parser: config.language === 'typescript' ? '@typescript-eslint/parser' : undefined,
          plugins: config.language === 'typescript' ? ['@typescript-eslint'] : undefined,
          env: { node: true, es6: true },
        }, null, 2),
        description: 'ESLint configuration',
      });
    }

    // Prettier
    if (config.includePrettier) {
      files.push({
        path: '.prettierrc',
        content: JSON.stringify({
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 100,
        }, null, 2),
        description: 'Prettier configuration',
      });
    }

    return files;
  }

  private getExtension(language: TemplateLanguage): string {
    const extensions: Record<TemplateLanguage, string> = {
      typescript: '.ts',
      javascript: '.js',
      python: '.py',
      rust: '.rs',
      go: '.go',
      java: '.java',
      csharp: '.cs',
    };
    return extensions[language];
  }

  private generateReadme(config: TemplateConfig): string {
    return `# ${config.name}

${config.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { main } from './src/index';

main();
\`\`\`

## License

This project is licensed under the ${config.license} License.
`;
  }

  private generatePackageJson(config: TemplateConfig): string {
    const pkg = {
      name: config.name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      description: config.description,
      main: config.language === 'typescript' ? 'dist/index.js' : 'src/index.js',
      scripts: {
        build: config.language === 'typescript' ? 'tsc' : undefined,
        test: 'vitest run',
        lint: 'eslint src --ext .ts,.js',
        'test:watch': 'vitest',
      },
      keywords: [],
      author: '',
      license: config.license,
      devDependencies: config.language === 'typescript' 
        ? { '@types/node': '^20.0.0', 'typescript': '^5.0.0', 'vitest': '^1.0.0', '@typescript-eslint/eslint-plugin': '^6.0.0', '@typescript-eslint/parser': '^6.0.0', 'eslint': '^8.0.0' }
        : { vitest: '^1.0.0' },
    };

    return JSON.stringify(pkg, null, 2);
  }

  private generateMainSource(config: TemplateConfig): string {
    if (config.language === 'typescript' || config.language === 'javascript') {
      return `/**
 * ${config.name}
 * ${config.description}
 */

export function main(): void {
  console.log('Hello from ${config.name}!');
}

// Run if executed directly
if (require.main === module) {
  main();
}
`;
    }
    
    if (config.language === 'python') {
      return `"""
${config.name}
${config.description}
"""

def main():
    print("Hello from ${config.name}!")

if __name__ == "__main__":
    main()
`;
    }

    if (config.language === 'rust') {
      return `//! ${config.name}
//! ${config.description}

fn main() {
    println!("Hello from ${config.name}!");
}
`;
    }

    return '// Entry point';
  }

  private generateTestFile(config: TemplateConfig): string {
    if (config.language === 'typescript' || config.language === 'javascript') {
      return `import { describe, it, expect } from 'vitest';

describe('${config.name}', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
`;
    }

    if (config.language === 'python') {
      return `import unittest

class TestMain(unittest.TestCase):
    def test_basic(self):
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()
`;
    }

    return '// Tests';
  }

  private generateGitignore(config: TemplateConfig): string {
    const base = `
# Dependencies
node_modules/
__pycache__/
*.pyc
target/
`;

    if (config.language === 'typescript') {
      return base + `
dist/
build/
`;
    }

    return base;
  }

  private generateLicense(type: LicenseType): string {
    const licenses: Record<LicenseType, string> = {
      'MIT': `MIT License

Copyright (c) ${new Date().getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
`,
      'Apache-2.0': `Apache License 2.0

Copyright ${new Date().getFullYear()}

Licensed under the Apache License, Version 2.0
`,
      'GPL-3.0': `GNU General Public License v3.0

Copyright ${new Date().getFullYear()}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation.
`,
      'BSD-3-Clause': `BSD 3-Clause License

Copyright ${new Date().getFullYear()}

Redistribution and use in source and binary forms are permitted.
`,
      'ISC': `ISC License

Copyright ${new Date().getFullYear()}

Permission to use, copy, modify, and/or distribute this software.
`,
      'Unlicense': `This is free and unencumbered software released into the public domain.

For more information, please refer to <https://unlicense.org/>
`,
    };

    return licenses[type];
  }

  private generateCIWorkflow(config: TemplateConfig): string {
    const nodeVersion = '20.x';
    
    return `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${nodeVersion}
      uses: actions/setup-node@v4
      with:
        node-version: ${nodeVersion}
        cache: 'npm'
    
    - run: npm ci
    ${config.includeESLint ? '\n    - run: npm run lint' : ''}
    ${config.includeTests ? '\n    - run: npm test' : ''}
    ${config.language === 'typescript' ? '\n    - run: npm run build' : ''}
`;
  }

  private generateDockerfile(config: TemplateConfig): string {
    if (config.language === 'typescript' || config.language === 'javascript') {
      return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
`;
    }

    if (config.language === 'python') {
      return `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "src/index.py"]
`;
    }

    return 'FROM alpine:latest\nCMD ["echo", "Hello"]\n';
  }

  private generateContributing(config: TemplateConfig): string {
    return `# Contributing to ${config.name}

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: \`npm install\`
4. Run tests: \`npm test\`

## Making Changes

1. Create a new branch for your feature
2. Make your changes
3. Ensure tests pass
4. Submit a pull request

## Code Style

Please follow the existing code style in the project.
`;
  }

  async getTemplate(id: string): Promise<RepositoryTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getAllTemplates(): Promise<RepositoryTemplate[]> {
    return Array.from(this.templates.values());
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async exportTemplate(id: string): Promise<string> {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found');

    return JSON.stringify(template, null, 2);
  }

  async importTemplate(json: string): Promise<RepositoryTemplate> {
    const template = JSON.parse(json) as RepositoryTemplate;
    this.templates.set(template.id, template);
    return template;
  }
}
