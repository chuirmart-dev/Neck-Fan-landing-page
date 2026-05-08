import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const images = [
  { url: 'https://images.unsplash.com/photo-1622543925917-763c34d1538c?q=80&w=1200&auto=format&fit=crop', name: 'hero.jpg' },
  { url: 'https://images.unsplash.com/photo-1591123720164-de1348028a82?q=80&w=800&auto=format&fit=crop', name: 'use1.jpg' },
  { url: 'https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?q=80&w=800&auto=format&fit=crop', name: 'use2.jpg' },
  { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop', name: 'product-detail.jpg' }
];

async function run() {
  const dir = path.join(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const img of images) {
    const dest = path.join(dir, img.name);
    try {
      await download(img.url, dest);
      console.log(`Downloaded ${img.name} to ${dest}`);
    } catch (err) {
      console.error(err.message);
    }
  }
}

run();
