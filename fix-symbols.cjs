const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'client', 'src'),
  path.join(ROOT, 'server')
];

const EXTENSIONS = new Set(['.jsx', '.js', '.css']);

const replacements = [
  ['\u00E2\u0152\u201E', '\u2304'],
  ['\u00E2\u2020\u2019', '\u2192'],
  ['\u00E2\u2020\u0090', '\u2190'],
  ['\u00E2\u0153\u201C', '\u2713'],
  ['\u00E2\u0153\u2022', '\u2715'],
  ['\u00E2\u02DC\u2026', '\u2605'],
  ['\u00E2\u02DC\u2020', '\u2606'],
  ['\u00E2\u20AC\u00A2', '\u2022']
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (EXTENSIONS.has(path.extname(item.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = TARGET_DIRS.flatMap(walk);
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const [bad, good] of replacements) {
    content = content.split(bad).join(good);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount += 1;
    console.log('Reparat: ' + file);
  }
}

console.log('Gata. Fisiere reparate: ' + changedCount);