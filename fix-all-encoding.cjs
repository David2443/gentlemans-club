const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'client', 'src'),
  path.join(ROOT, 'server')
];

const EXTENSIONS = new Set(['.jsx', '.js', '.css']);

const cp1252 = {
  0x20AC: 0x80,
  0x201A: 0x82,
  0x0192: 0x83,
  0x201E: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02C6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8A,
  0x2039: 0x8B,
  0x0152: 0x8C,
  0x017D: 0x8E,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201C: 0x93,
  0x201D: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02DC: 0x98,
  0x2122: 0x99,
  0x0161: 0x9A,
  0x203A: 0x9B,
  0x0153: 0x9C,
  0x017E: 0x9E,
  0x0178: 0x9F
};

function toCp1252Bytes(str) {
  const bytes = [];

  for (const ch of str) {
    const cp = ch.codePointAt(0);

    if (cp <= 0xFF) {
      bytes.push(cp);
    } else if (cp1252[cp] !== undefined) {
      bytes.push(cp1252[cp]);
    } else {
      return null;
    }
  }

  return Buffer.from(bytes);
}

function decodeMojibakeChunk(chunk) {
  const bytes = toCp1252Bytes(chunk);

  if (!bytes) return null;

  const decoded = bytes.toString('utf8');

  if (!decoded || decoded.includes('\uFFFD')) return null;
  if (decoded === chunk) return null;

  return decoded;
}

function fixText(text) {
  const starters = new Set(['Â', 'Ã', 'Ä', 'Å', 'È', 'É', 'â', 'ð']);
  let output = '';
  let i = 0;

  while (i < text.length) {
    const current = text[i];

    if (current === 'Â' && text[i + 1] === ' ') {
      output += ' ';
      i += 2;
      continue;
    }

    if (!starters.has(current)) {
      output += current;
      i += 1;
      continue;
    }

    let best = null;
    let bestLen = 0;

    const maxLen = Math.min(12, text.length - i);

    for (let len = 2; len <= maxLen; len++) {
      const chunk = text.slice(i, i + len);
      const decoded = decodeMojibakeChunk(chunk);

      if (decoded) {
        best = decoded;
        bestLen = len;
      }
    }

    if (best) {
      output += best;
      i += bestLen;
    } else {
      output += current;
      i += 1;
    }
  }

  return output;
}

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

  for (let pass = 0; pass < 3; pass++) {
    content = fixText(content);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount += 1;
    console.log('Reparat: ' + file);
  }
}

console.log('Gata. Fisiere reparate: ' + changedCount);