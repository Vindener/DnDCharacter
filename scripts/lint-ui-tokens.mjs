import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const PROP_RE =
  /\b(fontSize|padding|paddingVertical|paddingHorizontal|margin|marginTop|marginBottom|marginLeft|marginRight|gap|borderRadius):\s*\d+\b/g;

const ALLOWLIST = new Set([path.normalize('src/shared/styles/tokens.ts')]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

const violations = [];

for (const filePath of walk(SRC_DIR)) {
  const relativePath = path.normalize(path.relative(ROOT, filePath));
  if (ALLOWLIST.has(relativePath)) continue;

  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const matches = [...line.matchAll(PROP_RE)];
    for (const match of matches) {
      violations.push({
        file: relativePath,
        line: index + 1,
        token: match[0],
      });
    }
  });
}

if (!violations.length) {
  console.log('lint:ui passed');
  process.exit(0);
}

console.warn(`lint:ui soft report: found ${violations.length} raw spacing/typography/radius usages.`);
for (const violation of violations) {
  console.warn(`- ${violation.file}:${violation.line} -> ${violation.token}`);
}
console.warn('lint:ui soft mode does not fail CI. Prefer sp()/fs()/rd() token helpers for new code.');
process.exit(0);
