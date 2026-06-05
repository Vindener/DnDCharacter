import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) continue;
    files.push(fullPath);
  }

  return files;
}

function extractImports(code: string): string[] {
  const imports: string[] = [];
  const fromRegex = /from\s+['"]([^'"]+)['"]/g;
  const sideEffectRegex = /import\s+['"]([^'"]+)['"]/g;

  for (const match of code.matchAll(fromRegex)) imports.push(match[1]);
  for (const match of code.matchAll(sideEffectRegex)) imports.push(match[1]);

  return imports;
}

describe('dm domain boundary guards', () => {
  it('has no forbidden Character/store imports inside src/dm/domain and src/dm/repositories', () => {
    const root = process.cwd();
    const targets = [join(root, 'src', 'dm', 'domain'), join(root, 'src', 'dm', 'repositories')];
    const forbidden = [
      '@/types/Character',
      '@/stores/dmStore',
      '@/stores/characterStore',
      '@/repositories/character',
    ];

    const violations: string[] = [];

    for (const target of targets) {
      const files = collectFiles(target);
      for (const filePath of files) {
        const imports = extractImports(readFileSync(filePath, 'utf8'));
        for (const importedPath of imports) {
          const hasForbiddenAlias = forbidden.some((prefix) => importedPath.startsWith(prefix));
          const hasForbiddenCharacterStorePattern = /^@\/stores\/.*character/i.test(importedPath);
          const hasForbiddenCharacterRepoPattern = /^@\/repositories\/character/i.test(importedPath);
          if (hasForbiddenAlias || hasForbiddenCharacterStorePattern || hasForbiddenCharacterRepoPattern) {
            violations.push(`${filePath} -> ${importedPath}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps Character screens/hooks decoupled from legacy dmStore', () => {
    const root = process.cwd();
    const characterRoot = join(root, 'src', 'screens', 'Character');
    const files = collectFiles(characterRoot);
    const violations: string[] = [];

    for (const filePath of files) {
      const imports = extractImports(readFileSync(filePath, 'utf8'));
      for (const importedPath of imports) {
        if (importedPath === '@/stores/dmStore') {
          violations.push(`${filePath} -> ${importedPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
