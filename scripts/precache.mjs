// Rewrite the PRECACHE list in app/sw.js from the files in app/ (run after adding or removing files).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../app/', import.meta.url));
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = ['css', 'js', 'fonts', 'img', 'icons', 'data'].flatMap((d) => walk(join(app, d))).map((f) => relative(app, f).split(sep).join('/'))
  .filter((f) => !/-600\.webp$/.test(f)) // phones show the 1200 photos; the small set loads only when asked for (QA35)
  .sort();
const list = ['./', 'index.html', 'manifest.webmanifest', ...files].map((f) => `  '${f}',`).join('\n');
const sw = join(app, 'sw.js');
writeFileSync(sw, readFileSync(sw, 'utf8').replace(/const PRECACHE = \[[\s\S]*?\];/, `const PRECACHE = [\n${list}\n];`));
console.log(`precache: ${files.length + 3} entries`);
