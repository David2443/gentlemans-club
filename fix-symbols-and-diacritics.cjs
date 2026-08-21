const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'client', 'src'),
  path.join(ROOT, 'server')
];

const EXTENSIONS = new Set(['.jsx', '.js', '.css']);

const replacements = [
  ['â€¹', '‹'],
  ['â€º', '›'],
  ['â†’', '→'],
  ['â†', '←'],
  ['â†»', '↻'],
  ['âœ•', '✕'],
  ['âœ“', '✓'],
  ['âœ…', '✅'],
  ['â˜…', '★'],
  ['â˜†', '☆'],
  ['â€¢', '•'],
  ['â›”', '⛔'],
  ['âœ‚', '✂'],
  ['ðŸ’¬', '💬'],
  ['ðŸ‘‹', '👋'],
  ['ðŸ“…', '📅'],
  ['ðŸ“ž', '📞'],
  ['ðŸ“', '📍'],
  ['ðŸ—‘', '🗑'],
  ['Äƒ', 'ă'],
  ['Ä‚', 'Ă'],
  ['Ã¢', 'â'],
  ['Ã‚', 'Â'],
  ['Ã®', 'î'],
  ['ÃŽ', 'Î'],
  ['È™', 'ș'],
  ['È˜', 'Ș'],
  ['È›', 'ț'],
  ['Èš', 'Ț'],
  ['ÅŸ', 'ș'],
  ['Åž', 'Ș'],
  ['Å£', 'ț'],
  ['Å¢', 'Ț'],
  ['â€™', '’'],
  ['â€˜', '‘'],
  ['â€œ', '“'],
  ['â€�', '”'],
  ['â€ž', '„'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['â€¦', '…'],
  ['Â ', ' ']
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