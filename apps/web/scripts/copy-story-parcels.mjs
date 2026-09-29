// Copies ../../data/samples/story_parcels.json into public/data so the map can offer
// "story parcel" shortcut chips. Absence is tolerated (the chips simply do not render).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../data/samples/story_parcels.json');
const dst = resolve(here, '../public/data/story_parcels.json');
if (existsSync(src)) {
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  console.log('[story-parcels] copied', src);
} else {
  console.log('[story-parcels] not found, skipping:', src);
}
