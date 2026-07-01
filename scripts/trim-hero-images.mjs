// One-time preprocessing: trim the baked-in black letterbox bars off the
// project renders in public/work/, resize, and export optimized .webp files
// into public/work/hero/ for use as full-bleed hero backgrounds.
//
// Run with:  npm run prep:hero
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const SRC_DIR = join(process.cwd(), 'public', 'work');
const OUT_DIR = join(SRC_DIR, 'hero');
const MAX_WIDTH = 2400;

const slug = (name) =>
  basename(name, extname(name))
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SRC_DIR)).filter((f) => /\.(png|jpe?g)$/i.test(f));

  if (files.length === 0) {
    console.log('No source images found in', SRC_DIR);
    return;
  }

  for (const file of files) {
    const inPath = join(SRC_DIR, file);
    const outPath = join(OUT_DIR, `${slug(file)}.webp`);
    try {
      const before = await sharp(inPath).metadata();
      const info = await sharp(inPath)
        // Strip the near-black letterbox padding around the render.
        .trim({ background: '#000000', threshold: 20 })
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);
      console.log(
        `${file}: ${before.width}x${before.height}  ->  ${info.width}x${info.height}  (${(info.size / 1024).toFixed(0)} KB)  ${slug(file)}.webp`
      );
    } catch (err) {
      console.error(`FAILED ${file}:`, err.message);
    }
  }
}

run();
