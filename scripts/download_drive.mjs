import fs from 'fs';
import path from 'path';

const url = 'https://drive.google.com/drive/folders/1hfDSYLXQmfKl4ID6dkSaZZy0wzDM812q?usp=sharing';

async function main() {
  const outDir = path.resolve('downloaded_images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  console.log('HTML length:', html.length);

  // Write HTML to debug file if needed
  fs.writeFileSync('scripts/drive_dump.html', html);

  // Extract all file IDs and names from Drive JSON blob
  // Google Drive folders embed data in window['_DRIVE_BOOTSTRAP_DATA'] or similar
  const matches = [...html.matchAll(/\["([a-zA-Z0-9_-]{25,45})",\["([^"]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|heic|HEIC))"/g)];
  console.log(`Found ${matches.length} direct matches:`);

  const fileMap = new Map();
  for (const m of matches) {
    const id = m[1];
    const name = m[2];
    if (!fileMap.has(id)) {
      fileMap.set(id, name);
      console.log(`- ${name} (ID: ${id})`);
    }
  }

  if (fileMap.size === 0) {
    // Try broader regex for image names
    const allNames = [...html.matchAll(/"([^"]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|heic|HEIC))"/g)].map(m => m[1]);
    console.log('Filenames found in HTML:', [...new Set(allNames)]);

    const allIds = [...html.matchAll(/"([a-zA-Z0-9_-]{33})"/g)].map(m => m[1]);
    console.log('Candidate 33-char IDs found:', allIds.length);
  }

  // Save metadata
  fs.writeFileSync('scripts/found_files.json', JSON.stringify(Array.from(fileMap.entries()), null, 2));
}

main().catch(console.error);
