import fs from 'fs';
import path from 'path';

const items = JSON.parse(fs.readFileSync('scripts/drive_items.json', 'utf8'));

const outDir = path.resolve('public/photos');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function downloadFile(id, filename) {
  // Strip ONLY -0-16 at the end
  const cleanId = id.replace(/-0-16$/, '');
  const urls = [
    `https://lh3.googleusercontent.com/d/${cleanId}`,
    `https://drive.google.com/uc?export=download&id=${cleanId}`,
    `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 1000) {
          const filePath = path.join(outDir, filename);
          fs.writeFileSync(filePath, Buffer.from(buffer));
          console.log(`✓ Downloaded ${filename} (${buffer.byteLength} bytes) [ID: ${cleanId}]`);
          return { success: true, cleanId, size: buffer.byteLength, filename };
        }
      }
    } catch (e) {
      // Continue
    }
  }
  console.log(`✗ Failed to download ${filename} (ID: ${cleanId})`);
  return { success: false, cleanId, filename };
}

async function main() {
  console.log(`Downloading all ${items.length} images...`);
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const safeName = `fee_photo_${String(i + 1).padStart(2, '0')}.jpg`;
    const res = await downloadFile(it.id, safeName);
    results.push({ original: it.name, safeName, ...res });
    await new Promise(r => setTimeout(r, 150));
  }
  fs.writeFileSync('scripts/download_results.json', JSON.stringify(results, null, 2));
}

main().catch(console.error);
