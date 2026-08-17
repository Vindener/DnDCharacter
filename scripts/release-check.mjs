import { spawnSync } from 'node:child_process';

const STEPS = [
  { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
  { name: 'lint', command: 'npm', args: ['run', 'lint'] },
  { name: 'lint:theme', command: 'npm', args: ['run', 'lint:theme'] },
  { name: 'test:unit', command: 'npm', args: ['run', 'test:unit'] },
  { name: 'validate:srd', command: 'npm', args: ['run', 'validate:srd'] },
  { name: 'test:rules', command: 'npm', args: ['run', 'test:rules'] },
];

const results = [];

for (const step of STEPS) {
  console.log(`\n=== release:check → ${step.name} ===`);
  const { status } = spawnSync(step.command, step.args, { stdio: 'inherit', shell: process.platform === 'win32' });
  results.push({ name: step.name, passed: status === 0 });
}

console.log('\n=== release:check summary ===');
for (const result of results) {
  console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  console.log(`\nrelease:check FAILED — ${failed.length}/${results.length} step(s) failed: ${failed.map((f) => f.name).join(', ')}`);
  process.exit(1);
}

console.log(`\nrelease:check OK — ${results.length}/${results.length} step(s) passed.`);
