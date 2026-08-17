import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const ALLOWLIST = new Set([path.normalize('src/shared/styles/theme.ts')]);

const COLOR_LITERAL_RE =
  /(['"`])(?:#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\)|(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|tomato))\1/g;

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
    const matches = [...line.matchAll(COLOR_LITERAL_RE)];
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
  console.log('lint:theme passed');
  process.exit(0);
}

console.error('Theme color lint failed. Replace hardcoded color literals with theme tokens.');
for (const violation of violations) {
  console.error(`- ${violation.file}:${violation.line} -> ${violation.token}`);
}
process.exit(1);
