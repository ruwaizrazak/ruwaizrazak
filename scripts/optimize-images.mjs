// On-demand image optimizer — run when you add large images to /public:
//   npm run optimize-images
//
// LEARN: /public images bypass Astro's <Image> pipeline (they're served raw),
// so we optimize them ourselves. For each large raster that is *referenced in
// src/*, this:
//   1. writes a WebP twin (resized + quality 80) — typically 60–85% smaller,
//   2. rewrites the references (.png/.jpg -> .webp) across src/,
//   3. deletes the original raster.
//
// Safety: it ONLY ever converts/deletes files it matches as referenced. It
// never iterates over existing .webp files and never creates orphans —
// unreferenced rasters are reported and left untouched. Idempotent: on a second
// run there are no referenced rasters left, so it's a no-op.

import { readdirSync, statSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, extname, dirname, basename, relative, sep } from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = 'public';
const SRC_DIR = 'src';
const MIN_BYTES = 300 * 1024;   // only touch files larger than 300 KB
const MAX_WIDTH = 1600;          // cap longest display width
const QUALITY = 80;
// Never recompress the sprite sheet (frame alignment) or the avatar (Satori
// embeds it as base64 JPEG for OG images).
const SKIP = new Set(['characterSpriteSheet.png', 'avatar.jpg']);
const RASTER_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const TEXT_EXTS = new Set(['.astro', '.md', '.mdx', '.ts', '.tsx', '.js', '.jsx', '.json', '.css']);

function walk(dir, pred, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, pred, out);
    else if (pred(name, full, st)) out.push(full);
  }
  return out;
}

// Public-relative token without the leading "public/", with forward slashes —
// matches both "/works/x/foo.png" and "works/x/foo.png" in source.
const toToken = (full) => relative(PUBLIC_DIR, full).split(sep).join('/');

// 1. Candidate rasters.
const candidates = walk(PUBLIC_DIR, (name, full, st) =>
  RASTER_EXTS.has(extname(name).toLowerCase()) && !SKIP.has(name) && st.size >= MIN_BYTES,
);

// 2. Load all source text files once.
const srcFiles = walk(SRC_DIR, (name) => TEXT_EXTS.has(extname(name).toLowerCase()))
  .map((path) => ({ path, content: readFileSync(path, 'utf8') }));

let savedBytes = 0;
const converted = [];
const orphans = [];
const dirtyFiles = new Set();

for (const full of candidates) {
  const token = toToken(full);                                  // e.g. works/fv3/foo.png
  const webpToken = token.slice(0, -extname(token).length) + '.webp';
  const referencingFiles = srcFiles.filter((f) => f.content.includes(token));

  if (referencingFiles.length === 0) {
    orphans.push(full);   // unreferenced — leave it alone, just report it
    continue;
  }

  const out = join(dirname(full), basename(full, extname(full)) + '.webp');
  const origSize = statSync(full).size;
  if (!existsSync(out)) {
    await sharp(full).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
  }
  const newSize = statSync(out).size;
  savedBytes += origSize - newSize;

  for (const f of referencingFiles) {
    f.content = f.content.split(token).join(webpToken);
    dirtyFiles.add(f);
  }
  rmSync(full);   // referenced original now swapped to .webp — safe to remove
  converted.push({ token, webpToken, origSize, newSize, refs: referencingFiles.length });
  console.log(`${token}  ${(origSize / 1024) | 0}KB -> ${(newSize / 1024) | 0}KB  (${referencingFiles.length} ref${referencingFiles.length > 1 ? 's' : ''})`);
}

// 3. Flush rewritten source files.
for (const f of dirtyFiles) writeFileSync(f.path, f.content);

console.log(`\nConverted ${converted.length} image(s), updated ${dirtyFiles.size} source file(s), saved ~${(savedBytes / 1024 / 1024).toFixed(1)} MB.`);
if (orphans.length) {
  console.log(`\nSkipped ${orphans.length} large image(s) not referenced in src/ (left untouched):`);
  for (const o of orphans) console.log('  ' + o);
}
