const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const files = {
  app: path.join(ROOT, 'client', 'src', 'App.jsx'),
  profile: path.join(ROOT, 'client', 'src', 'BarberProfile.jsx'),
  admin: path.join(ROOT, 'client', 'src', 'AdminPanel.jsx'),
  master: path.join(ROOT, 'client', 'src', 'MasterDashboard.jsx'),
  messages: path.join(ROOT, 'client', 'src', 'MasterMessages.jsx'),
  gallery: path.join(ROOT, 'client', 'src', 'GalleryPage.jsx'),
  server: path.join(ROOT, 'server', 'index.js'),
  env: path.join(ROOT, 'server', '.env')
};

function backup(file) {
  if (!fs.existsSync(file)) return;

  const backupPath = file + '.bak-tracy';

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(file, backupPath);
  }
}

function read(file) {
  if (!fs.existsSync(file)) {
    console.log('Lipseste: ' + file);
    return '';
  }

  return fs.readFileSync(file, 'utf8');
}

function write(file, content, original) {
  if (!fs.existsSync(file)) return;

  if (content !== original) {
    backup(file);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modificat: ' + file);
  } else {
    console.log('Neschimbat: ' + file);
  }
}

function findMatching(text, openIndex) {
  const open = text[openIndex];
  const close = open === '[' ? ']' : open === '{' ? '}' : open === '(' ? ')' : null;
  if (!close) return -1;

  let depth = 0;
  let quote = null;
  let escape = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }

    if (quote) {
      if (escape) {
        escape = false;
        continue;
      }

      if (ch === '\\') {
        escape = true;
        continue;
      }

      if (ch === quote) {
        quote = null;
      }

      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === open) depth++;
    if (ch === close) depth--;

    if (depth === 0) return i;
  }

  return -1;
}

function replaceConstValue(content, constName, newValue) {
  const re = new RegExp('const\\s+' + constName + '\\s*=\\s*');
  const match = re.exec(content);

  if (!match) {
    console.log('Nu am gasit const ' + constName);
    return content;
  }

  const start = match.index;
  const afterEquals = match.index + match[0].length;
  const openIndex = content.slice(afterEquals).search(/[\\[\\{]/);

  if (openIndex === -1) return content;

  const realOpenIndex = afterEquals + openIndex;
  const endIndex = findMatching(content, realOpenIndex);

  if (endIndex === -1) return content;

  let finalEnd = endIndex + 1;

  while (content[finalEnd] && /\s/.test(content[finalEnd])) finalEnd++;
  if (content[finalEnd] === ';') finalEnd++;

  return (
    content.slice(0, start) +
    'const ' + constName + ' = ' + newValue + ';' +
    content.slice(finalEnd)
  );
}

function replaceObjectArrayProperty(content, propName, newArrayCode) {
  const propRe = new RegExp(propName + '\\s*:\\s*\\[', 'm');
  const match = propRe.exec(content);

  if (!match) {
    console.log('Nu am gasit proprietatea ' + propName);
    return content;
  }

  const propStart = match.index;
  const openIndex = content.indexOf('[', propStart);
  const endIndex = findMatching(content, openIndex);

  if (endIndex === -1) return content;

  return (
    content.slice(0, propStart) +
    propName + ': ' + newArrayCode +
    content.slice(endIndex + 1)
  );
}

const appBarbers = `[
  {
    id: 'dani-frizeru',
    name: 'Dani Frizeru',
    role: 'Master Barber',
    label: 'MASTER',
    specialty: 'Stil. \\u00CEncredere. Distinc\\u021Bie.',
    description: 'Nu este doar o tunsoare, este o experien\\u021B\\u0103.',
    image: '/dani-frizeru.png',
    isMaster: true
  },
  {
    id: 'croco-frizeru',
    name: 'Croco Frizeru',
    role: 'Premium Barber',
    label: 'NOU \\u00CEN ECHIP\\u0102',
    specialty: 'Tunsori moderne \\u0219i clasice, barb\\u0103 aranjat\\u0103 cu precizie.',
    description: 'Stil. Precizie. Atitudine.',
    image: '/croco-frizeru.png',
    isMaster: false
  },
  {
    id: 'vali-frizeru',
    name: 'Vali Frizeru',
    role: 'Barber Specialist',
    label: 'SONIC STYLE',
    specialty: 'Tuns b\\u0103rba\\u021Bi, barb\\u0103 & contur, styling profesional.',
    description: 'Stilul t\\u0103u, semn\\u0103tura noastr\\u0103.',
    image: '/vali-frizeru.png',
    isMaster: false
  },
  {
    id: 'tracy-pensat',
    name: 'Tracy',
    role: 'Brow Specialist',
    label: 'PENSAT PERFECT',
    specialty: 'Pensat perfect, \\u00EEncredere total\\u0103.',
    description: 'Mai mult dec\\u00E2t un pensat. Este stilul t\\u0103u.',
    image: '/tracy-pensat.png',
    isMaster: false
  }
]`;

const adminBarbers = `[
  { id: 'dani-frizeru', label: 'Dani Frizeru', short: 'Dani' },
  { id: 'croco-frizeru', label: 'Croco Frizeru', short: 'Croco' },
  { id: 'vali-frizeru', label: 'Vali Frizeru', short: 'Vali' },
  { id: 'tracy-pensat', label: 'Tracy', short: 'Tracy' }
]`;

const masterBarbers = `[
  { value: 'all', label: 'To\\u021Bi speciali\\u0219tii', short: 'To\\u021Bi' },
  { value: 'dani-frizeru', label: 'Dani Frizeru', short: 'Dani' },
  { value: 'croco-frizeru', label: 'Croco Frizeru', short: 'Croco' },
  { value: 'vali-frizeru', label: 'Vali Frizeru', short: 'Vali' },
  { value: 'tracy-pensat', label: 'Tracy', short: 'Tracy' }
]`;

const messageBarbers = `[
  {
    value: 'dani-frizeru',
    label: 'Dani Frizeru',
    short: 'Dani',
    path: '/admin/dani-frizeru'
  },
  {
    value: 'croco-frizeru',
    label: 'Croco Frizeru',
    short: 'Croco',
    path: '/admin/croco-frizeru'
  },
  {
    value: 'vali-frizeru',
    label: 'Vali Frizeru',
    short: 'Vali',
    path: '/admin/vali-frizeru'
  },
  {
    value: 'tracy-pensat',
    label: 'Tracy',
    short: 'Tracy',
    path: '/admin/tracy-pensat'
  }
]`;

const browServicesFrontend = `[
  {
    nume: 'PENSAT',
    pret: '35 LEI',
    desc: 'Contur perfect pentru un look \\u00EEngrijit.'
  },
  {
    nume: 'PENSAT + VOPSIT',
    pret: '50 LEI',
    desc: 'Definire mai clar\\u0103 \\u0219i aspect \\u00EEngrijit.'
  },
  {
    nume: 'PENSAT + P\\u0102R NAS',
    pret: '45 LEI',
    desc: '\\u00CEngrijire complet\\u0103 pentru detalii.'
  },
  {
    nume: 'TRATAMENT FACIAL',
    pret: '50 LEI',
    desc: 'Prospe\\u021Bime \\u0219i aspect \\u00EEngrijit.'
  },
  {
    nume: 'PACHET COMPLET',
    pret: '100 LEI',
    desc: 'Pensat + vopsit + p\\u0103r nas + tratament facial.',
    vip: true
  }
]`;

const browServicesProfile = `[
  {
    nume: 'Pensat',
    pret: '35 LEI',
    desc: 'Contur perfect pentru un look \\u00EEngrijit.'
  },
  {
    nume: 'Pensat + vopsit',
    pret: '50 LEI',
    desc: 'Definire mai clar\\u0103 \\u0219i aspect \\u00EEngrijit.'
  },
  {
    nume: 'Pensat + p\\u0103r nas',
    pret: '45 LEI',
    desc: '\\u00CEngrijire complet\\u0103 pentru detalii.'
  },
  {
    nume: 'Tratament facial',
    pret: '50 LEI',
    desc: 'Prospe\\u021Bime \\u0219i aspect \\u00EEngrijit.'
  },
  {
    nume: 'Pachet complet',
    pret: '100 LEI',
    desc: 'Pensat + vopsit + p\\u0103r nas + tratament facial.',
    vip: true
  }
]`;

const barbersDB = `{
  'dani-frizeru': {
    barberId: 'dani-frizeru',
    name: 'Dani Frizeru',
    role: 'Master Barber',
    badge: 'MASTER',
    image: '/dani-frizeru.png',
    isMaster: true,
    description: 'Nu este doar o tunsoare, este o experien\\u021B\\u0103.',
    services: BARBER_SERVICES,
    gallery: []
  },

  'croco-frizeru': {
    barberId: 'croco-frizeru',
    name: 'Croco Frizeru',
    role: 'Premium Barber',
    badge: 'NOU \\u00CEN ECHIP\\u0102',
    image: '/croco-frizeru.png',
    isMaster: false,
    description: 'Stil. Precizie. Atitudine.',
    services: BARBER_SERVICES,
    gallery: []
  },

  'vali-frizeru': {
    barberId: 'vali-frizeru',
    name: 'Vali Frizeru',
    role: 'Barber Specialist',
    badge: 'SONIC STYLE',
    image: '/vali-frizeru.png',
    isMaster: false,
    description: 'Stilul t\\u0103u, semn\\u0103tura noastr\\u0103.',
    services: BARBER_SERVICES,
    gallery: []
  },

  'tracy-pensat': {
    barberId: 'tracy-pensat',
    name: 'Tracy',
    role: 'Brow Specialist',
    badge: 'PENSAT PERFECT',
    image: '/tracy-pensat.png',
    isMaster: false,
    description: 'Pensat perfect, \\u00EEncredere total\\u0103.',
    services: BROW_SERVICES,
    gallery: []
  }
}`;

const serverTeamBarbers = `[
  {
    barberId: 'dani-frizeru',
    username: 'dani',
    password: requireStrongEnv('PASS_DANI', 12),
    nume: 'Dani Frizeru',
    displayName: 'Dani Frizeru',
    role: 'Master Barber',
    specialty: 'Stil. \\u00CEncredere. Distinc\\u021Bie.',
    description: 'Nu este doar o tunsoare, este o experien\\u021B\\u0103.',
    image: '/dani-frizeru.png',
    isMaster: true,
    isAdmin: true,
    order: 1,
    services: BARBER_SERVICES
  },
  {
    barberId: 'croco-frizeru',
    username: 'croco',
    password: requireStrongEnv('PASS_CROCO', 12),
    nume: 'Croco Frizeru',
    displayName: 'Croco Frizeru',
    role: 'Premium Barber',
    specialty: 'Tunsori moderne \\u0219i clasice, barb\\u0103 aranjat\\u0103 cu precizie.',
    description: 'Stil. Precizie. Atitudine.',
    image: '/croco-frizeru.png',
    isMaster: false,
    isAdmin: false,
    order: 2,
    services: BARBER_SERVICES
  },
  {
    barberId: 'vali-frizeru',
    username: 'vali',
    password: requireStrongEnv('PASS_VALI', 12),
    nume: 'Vali Frizeru',
    displayName: 'Vali Frizeru',
    role: 'Barber Specialist',
    specialty: 'Tuns b\\u0103rba\\u021Bi, barb\\u0103 & contur, styling profesional.',
    description: 'Stilul t\\u0103u, semn\\u0103tura noastr\\u0103.',
    image: '/vali-frizeru.png',
    isMaster: false,
    isAdmin: false,
    order: 3,
    services: BARBER_SERVICES
  },
  {
    barberId: 'tracy-pensat',
    username: 'tracy',
    password: requireStrongEnv('PASS_TRACY', 12),
    nume: 'Tracy',
    displayName: 'Tracy',
    role: 'Brow Specialist',
    specialty: 'Pensat perfect, \\u00EEncredere total\\u0103.',
    description: 'Mai mult dec\\u00E2t un pensat. Este stilul t\\u0103u.',
    image: '/tracy-pensat.png',
    isMaster: false,
    isAdmin: false,
    order: 4,
    services: BROW_SERVICES
  }
]`;

const serverBrowServices = `[
  'Pensat',
  'Pensat + vopsit',
  'Pensat + p\\u0103r nas',
  'Tratament facial',
  'Pachet complet'
]`;

const legacyNames = `{
  'dani-frizeru': ['Dani', 'Dani Frizeru', 'dani', 'dani-frizeru'],
  'croco-frizeru': ['Croco', 'Croco Frizeru', 'croco', 'croco-frizeru'],
  'vali-frizeru': ['Vali', 'Vali Frizeru', 'vali', 'vali-frizeru'],
  'tracy-pensat': ['Tracy', 'tracy', 'Tracy Pensat', 'tracy-pensat']
}`;

const galleryBarbers = `[
  {
    id: 'dani-frizeru',
    display: 'Dani Frizeru',
    aliases: ['dani', 'dani frizeru', 'dani-frizeru']
  },
  {
    id: 'croco-frizeru',
    display: 'Croco Frizeru',
    aliases: ['croco', 'croco frizeru', 'croco-frizeru']
  },
  {
    id: 'vali-frizeru',
    display: 'Vali Frizeru',
    aliases: ['vali', 'vali frizeru', 'vali-frizeru']
  },
  {
    id: 'tracy-pensat',
    display: 'Tracy',
    aliases: ['tracy', 'tracy pensat', 'tracy-pensat', 'pensat', 'brow specialist']
  }
]`;

// App.jsx
{
  const file = files.app;
  const original = read(file);
  let content = original;

  if (content) {
    content = replaceConstValue(content, 'BARBERS', appBarbers);
    content = replaceObjectArrayProperty(content, 'pensat', browServicesFrontend);
    write(file, content, original);
  }
}

// BarberProfile.jsx
{
  const file = files.profile;
  const original = read(file);
  let content = original;

  if (content) {
    content = replaceConstValue(content, 'BROW_SERVICES', browServicesProfile);
    content = replaceConstValue(content, 'barbersDB', barbersDB);
    content = content.replace(/const\\s+BARBERS_HALF_HOUR\\s*=\\s*\\[[\\s\\S]*?\\];/, 'const BARBERS_HALF_HOUR = [];');
    write(file, content, original);
  }
}

// AdminPanel.jsx
{
  const file = files.admin;
  const original = read(file);
  let content = original;

  if (content) {
    content = replaceConstValue(content, 'BARBERS', adminBarbers);
    content = replaceConstValue(content, 'BROW_SERVICES', browServicesProfile);
    content = content.replace(/const\\s+BARBERI_PROGRAM_EXTINS\\s*=\\s*\\[[\\s\\S]*?\\];/, 'const BARBERI_PROGRAM_EXTINS = [];');

    content = content.replace(
      /return\\s+currentBarber\\.id\\s*===\\s*['"][^'"]+['"]\\s*\\?\\s*BROW_SERVICES\\s*:\\s*BARBER_SERVICES;/g,
      "return currentBarber.id === 'tracy-pensat' ? BROW_SERVICES : BARBER_SERVICES;"
    );

    content = content.replace(
      /return\\s+\\[[^\\]]*\\]\\.includes\\(currentBarber\\.id\\)\\s*\\?\\s*BROW_SERVICES\\s*:\\s*BARBER_SERVICES;/g,
      "return currentBarber.id === 'tracy-pensat' ? BROW_SERVICES : BARBER_SERVICES;"
    );

    write(file, content, original);
  }
}

// MasterDashboard.jsx
{
  const file = files.master;
  const original = read(file);
  let content = original;

  if (content) {
    content = replaceConstValue(content, 'BARBERS', masterBarbers);
    write(file, content, original);
  }
}

// MasterMessages.jsx
{
  const file = files.messages;
  const original = read(file);
  let content = original;

  if (content) {
    content = replaceConstValue(content, 'BARBERS', messageBarbers);
    write(file, content, original);
  }
}

// GalleryPage.jsx
{
  const file = files.gallery;
  const original = read(file);
  let content = original;

  if (content) {
    const constRe = /const\\s+([A-Za-z0-9_]+)\\s*=\\s*\\[/g;
    let match;

    while ((match = constRe.exec(content))) {
      const name = match[1];
      const openIndex = content.indexOf('[', match.index);
      const endIndex = findMatching(content, openIndex);

      if (endIndex === -1) continue;

      const block = content.slice(match.index, endIndex + 1);

      if (
        block.includes('dani-frizeru') &&
        block.includes('display') &&
        block.includes('aliases')
      ) {
        content =
          content.slice(0, match.index) +
          'const ' + name + ' = ' + galleryBarbers +
          content.slice(endIndex + 1);

        break;
      }
    }

    write(file, content, original);
  }
}

// server/index.js
{
  const file = files.server;
  const original = read(file);
  let content = original;

  if (content) {
    content = replaceConstValue(content, 'BROW_SERVICES', serverBrowServices);
    content = replaceConstValue(content, 'TEAM_BARBERS', serverTeamBarbers);
    content = replaceConstValue(content, 'LEGACY_BARBER_NAMES', legacyNames);
    content = content.replace(/const\\s+BARBERI_PROGRAM_EXTINS\\s*=\\s*\\[[\\s\\S]*?\\];/, 'const BARBERI_PROGRAM_EXTINS = [];');
    write(file, content, original);
  }
}

// server/.env local
{
  const file = files.env;

  if (fs.existsSync(file)) {
    const original = read(file);
    let content = original;

    if (!/^PASS_TRACY=/m.test(content)) {
      content += '\\nPASS_TRACY=TracyGC2026!\\n';
    }

    write(file, content, original);
  }
}

console.log('');
console.log('Gata. Tracy a fost adaugata ca specialist pentru pensat/facial.');
console.log('Nu uita: poza trebuie sa fie client/public/tracy-pensat.png');
console.log('In Render trebuie adaugat PASS_TRACY=TracyGC2026!');