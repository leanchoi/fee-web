import fs from 'fs';

const html = fs.readFileSync('scripts/drive_dump.html', 'utf8');

// Find all occurrences where a WhatsApp filename is preceded or succeeded by a Google Drive ID (usually 33 chars like 1A2b3C...)
const files = [];
const regex = /"([a-zA-Z0-9_-]{28,38})"[^\]]*?"(WhatsApp Image [^"]+\.jpeg)"/g;
let m;
while ((m = regex.exec(html)) !== null) {
  files.push({ id: m[1], name: m[2] });
}

console.log('Method 1 found:', files.length);

if (files.length === 0) {
  // Try pattern where name comes before ID or in array: [ "id", "name" ]
  const regex2 = /"(WhatsApp Image [^"]+\.jpeg)"[^\]]*?"([a-zA-Z0-9_-]{28,38})"/g;
  while ((m = regex2.exec(html)) !== null) {
    files.push({ id: m[2], name: m[1] });
  }
  console.log('Method 2 found:', files.length);
}

// Let's inspect a chunk of HTML around a filename
const sampleIdx = html.indexOf('WhatsApp Image');
if (sampleIdx !== -1) {
  console.log('Sample context around filename:');
  console.log(html.substring(Math.max(0, sampleIdx - 150), sampleIdx + 150));
}
