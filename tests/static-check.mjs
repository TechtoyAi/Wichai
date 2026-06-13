// Static verification for browser-only ES modules.
// The scenes reference global Phaser/Howl, so they can't be imported in node.
// Instead we:
//   1. syntax-check every src/**/*.js via `node --check`
//   2. resolve every relative import to an existing file
// Catches the two most common breakages (syntax errors, dangling imports)
// without a browser.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(webDir, 'src');

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : (p.endsWith('.js') ? [p] : []);
  });
}

const files = walk(srcDir);
const errors = [];

for (const file of files) {
  const code = readFileSync(file, 'utf8');
  const rel = relative(webDir, file);

  // 1. Syntax check
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    errors.push(`SYNTAX ${rel}: ${String(e.stderr || e.message).trim()}`);
    continue;
  }

  // 2. Relative import resolution
  const importRe = /(?:import|export)[^'"]*?from\s*['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(code)) !== null) {
    const target = resolve(dirname(file), m[1]);
    if (!existsSync(target)) {
      errors.push(`IMPORT ${rel}: cannot resolve '${m[1]}' -> ${relative(webDir, target)}`);
    }
  }
}

if (errors.length) {
  console.error('X static-check FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log(`OK static-check passed (${files.length} files, syntax + imports OK)`);
