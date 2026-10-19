// Places the real STIKR bag over the generic bag in each scene photo.
// Reads untouched scenes from scripts/scene-originals/ and writes public/images/<name>.png.
// Usage: node scripts/brand-scenes.mjs [name ...]   (pass --preview to also write small previews to %TEMP%)
import sharp from "sharp";
import os from "node:os";
import path from "node:path";

const BAG = {
  "black-side": "public/images/product.png",
  "pink-side": "public/images/product-pink.png",
  "black-front": "public/images/brand/cutout-black-front.png",
  "pink-front": "public/images/brand/cutout-pink-front.png",
};

// height: bag height in scene pixels; left/top: where the bag's box goes; flip: mirror; rotate: degrees clockwise;
// crop: optional final crop of the scene so the whole bag fits its slot on the page.
// ~70% black / ~30% pink across the site.
const SCENES = {
  "color-stay": { bag: "black-side", height: 1250, left: 250, top: 1120, rotate: 30 },
  "intro-product": { bag: "black-side", height: 520, left: 110, top: 95 },
  "bf-popup": { bag: "black-side", height: 520, left: 25, top: 100, crop: { left: 0, top: 55, width: 390, height: 610 } },
  "color-move": { bag: "black-front", height: 1400, left: 470, top: -90 },
  "benefit-3": { bag: "pink-front", height: 440, left: 35, top: 355 },
  "color-keep": { bag: "pink-side", height: 1130, left: 400, top: 190 },
  "benefit-5": { bag: "pink-side", height: 1220, left: 430, top: 320, rotate: -18 },
};

const args = process.argv.slice(2);
const preview = args.includes("--preview");
const names = args.filter((a) => !a.startsWith("--"));

for (const name of names.length ? names : Object.keys(SCENES)) {
  const s = SCENES[name];
  const src = `scripts/scene-originals/${name}.png`;
  const meta = await sharp(src).metadata();

  let bag = sharp(BAG[s.bag]).resize({ height: s.height });
  if (s.flip) bag = sharp(await bag.flop().toBuffer());
  if (s.rotate) bag = sharp(await bag.rotate(s.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer());
  let { data, info } = await bag.png().toBuffer({ resolveWithObject: true });

  // Crop whatever falls outside the scene so sharp accepts the composite.
  const left = Math.max(0, s.left);
  const top = Math.max(0, s.top);
  const width = Math.min(info.width - (left - s.left), meta.width - left);
  const height = Math.min(info.height - (top - s.top), meta.height - top);
  data = await sharp(data).extract({ left: left - s.left, top: top - s.top, width, height }).toBuffer();

  let out = await sharp(src).composite([{ input: data, left, top }]).png().toBuffer();
  out = await sharp(out).extract(s.crop ?? { left: 0, top: 0, width: meta.width, height: meta.height }).png({ compressionLevel: 9 }).toBuffer();
  await sharp(out).toFile(`public/images/${name}.png`);
  if (preview) await sharp(out).resize({ height: 600 }).toFile(path.join(os.tmpdir(), `brand-${name}.png`));
  console.log(`${name}: ${s.bag}`);
}
