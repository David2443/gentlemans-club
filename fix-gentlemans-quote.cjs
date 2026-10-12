const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const files = [
  path.join(ROOT, 'client', 'src', 'App.jsx'),
  path.join(ROOT, 'client', 'src', 'BarberProfile.jsx'),
  path.join(ROOT, 'client', 'src', 'AdminPanel.jsx'),
  path.join(ROOT, 'server', 'index.js')
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Nu exista: ' + file);
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content
    .split(`'PACHET GENTLEMAN'S CLUB'`).join(`"PACHET GENTLEMAN'S CLUB"`)
    .split(`'Pachet Gentleman's Club'`).join(`"Pachet Gentleman's Club"`);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Reparat: ' + file);
  } else {
    console.log('Neschimbat: ' + file);
  }
}

console.log('Gata. Apostroful din Gentleman’s Club a fost reparat.');