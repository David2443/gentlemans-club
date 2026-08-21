const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'client', 'src'),
  path.join(ROOT, 'server')
];

const EXTENSIONS = new Set(['.jsx', '.js', '.css']);

const replacements = [
  ['\u00C4\u0192', '\u0103'],
  ['\u00C4\u201A', '\u0102'],
  ['\u00C3\u00A2', '\u00E2'],
  ['\u00C3\u201A', '\u00C2'],
  ['\u00C3\u00AE', '\u00EE'],
  ['\u00C3\u017D', '\u00CE'],
  ['\u00C8\u2122', '\u0219'],
  ['\u00C8\u02DC', '\u0218'],
  ['\u00C8\u203A', '\u021B'],
  ['\u00C8\u0161', '\u021A'],
  ['\u00C5\u0178', '\u0219'],
  ['\u00C5\u017D', '\u0218'],
  ['\u00C5\u00A3', '\u021B'],
  ['\u00C5\u00A2', '\u021A'],
  ['\u00E2\u20AC\u2122', '\u2019'],
  ['\u00E2\u20AC\u02DC', '\u2018'],
  ['\u00E2\u20AC\u0153', '\u201C'],
  ['\u00E2\u20AC\u009D', '\u201D'],
  ['\u00E2\u20AC\u017E', '\u201E'],
  ['\u00E2\u20AC\u201C', '\u2013'],
  ['\u00E2\u20AC\u201D', '\u2014'],
  ['\u00E2\u20AC\u00A6', '\u2026'],
  ['\u00C2 ', ' ']
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