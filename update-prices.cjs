const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const files = [
  path.join(ROOT, 'client', 'src', 'App.jsx'),
  path.join(ROOT, 'client', 'src', 'BarberProfile.jsx'),
  path.join(ROOT, 'client', 'src', 'AdminPanel.jsx'),
  path.join(ROOT, 'server', 'index.js')
];

function backup(file) {
  const backupPath = file + '.bak-prices';
  if (fs.existsSync(file) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(file, backupPath);
  }
}

function replacePriceById(content, id, price) {
  const re = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?price:\\s*)(null|\\d+)`, 'g');
  return content.replace(re, `$1${price}`);
}

function replacePriceByName(content, name, priceText) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(nume:\\s*['"]${escaped}['"][\\s\\S]*?pret:\\s*)['"][^'"]+['"]`, 'g');
  return content.replace(re, `$1'${priceText}'`);
}

function replaceServiceName(content, oldName, newName) {
  return content.split(oldName).join(newName);
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Nu exista: ' + file);
    continue;
  }

  const original = fs.readFileSync(file, 'utf8');
  let content = original;

  // Prețuri după id-uri folosite în BarberProfile/AdminPanel
  content = replacePriceById(content, 'tuns', 65);
  content = replacePriceById(content, 'tuns-barba', 95);
  content = replacePriceById(content, 'barba', 35);
  content = replacePriceById(content, 'vopsit-barba', 35);
  content = replacePriceById(content, 'spalat', 25);
  content = replacePriceById(content, 'pachet-vip', 250);

  // Prețuri după nume folosite în App.jsx
  content = replacePriceByName(content, 'TUNS', '65 LEI');
  content = replacePriceByName(content, 'TUNS CLASIC', '65 LEI');
  content = replacePriceByName(content, 'TUNS + BARBĂ', '95 LEI');
  content = replacePriceByName(content, 'SPĂLAT', '25 LEI');
  content = replacePriceByName(content, 'VOPSIT BARBĂ', '35 LEI');
  content = replacePriceByName(content, 'BARBĂ', '35 LEI');
  content = replacePriceByName(content, 'PACHET VIP', '250 LEI');
  content = replacePriceByName(content, "PACHET GENTLEMAN'S CLUB", '250 LEI');

  // Redenumire pachet
  content = replaceServiceName(content, 'Pachet VIP', "Pachet Gentleman's Club");
  content = replaceServiceName(content, 'PACHET VIP', "PACHET GENTLEMAN'S CLUB");

  // Update descriere pachet unde exista
  content = content.replace(
    /desc:\s*['"]Tuns \+ barbă \+ spălat \+ aranjat \+ prosop fierbinte \+ tratament facial\.['"]/g,
    "desc: 'Tuns + barbă + spălat + finisaj premium.'"
  );

  if (content !== original) {
    backup(file);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modificat: ' + file);
  } else {
    console.log('Neschimbat: ' + file);
  }
}

console.log('Gata. Preturile au fost actualizate.');