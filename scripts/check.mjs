// Runs lint, tests and build at the same time and fails if any of them fails.
// Output is buffered per step so the logs stay readable.
import { spawn } from 'node:child_process';

const steps = ['lint', 'test', 'inventory:test', 'build'];

const run = (name) =>
  new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(`bun run ${name}`, { shell: true, env: process.env });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => resolve({ name, code, output, seconds: (Date.now() - started) / 1000 }));
  });

const results = await Promise.all(steps.map(run));
for (const { name, code, output } of results) {
  if (code !== 0) console.log(`\n----- ${name} output -----\n${output}`);
}
console.log('');
for (const { name, code, seconds } of results) {
  console.log(`${code === 0 ? 'ok  ' : 'FAIL'} ${name.padEnd(14)} ${seconds.toFixed(1)} s`);
}
process.exit(results.some((r) => r.code !== 0) ? 1 : 0);
