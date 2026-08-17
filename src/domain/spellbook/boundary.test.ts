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

function isAllowedInfraDependency(filePath: string, importedPath: string): boolean {
  const localRepoFile = filePath.endsWith(join('src', 'domain', 'spellbook', 'spellLocalRepository.ts'));
  return localRepoFile && importedPath === '@react-native-async-storage/async-storage';
}

describe('spellbook domain boundary guards', () => {
  it('has no UI/store layer dependencies inside src/domain/spellbook', () => {
    const root = process.cwd();
    const target = join(root, 'src', 'domain', 'spellbook');

    const forbiddenAliasPrefixes = ['@/screens', '@/components', '@/context', '@/stores'];
    const violations: string[] = [];

    for (const filePath of collectFiles(target)) {
      const imports = extractImports(readFileSync(filePath, 'utf8'));
      for (const importedPath of imports) {
        if (forbiddenAliasPrefixes.some((prefix) => importedPath.startsWith(prefix))) {
          violations.push(`${filePath} -> ${importedPath}`);
          continue;
        }

        const isReactNativeDependency =
          importedPath === 'react-native' || importedPath.startsWith('react-native/') || importedPath.startsWith('@react-native');

        if (isReactNativeDependency && !isAllowedInfraDependency(filePath, importedPath)) {
          violations.push(`${filePath} -> ${importedPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
