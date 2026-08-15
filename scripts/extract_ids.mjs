import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('scripts/drive_dump.html', 'utf8');

// Regex to match aria-label="FILENAME" ... ssk='...:FILE_ID-...'
const regex = /aria-label="([^"]+\.jpeg)[^"]*"[^>]*?ssk='[^:]+:[^:]+:([a-zA-Z0-9_-]{28,38})/g;

const items = [];
let m;
while ((m = regex.exec(html)) !== null) {
  items.push({ name: m[1], id: m[2] });
}

console.log(`Found ${items.length} images:`);
items.forEach((it, idx) => console.log(`${idx + 1}. ${it.name} -> ID: ${it.id}`));

fs.writeFileSync('scripts/drive_items.json', JSON.stringify(items, null, 2));
