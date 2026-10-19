// Turns the white-background brand photos into transparent product cut-outs.
// Usage: node scripts/cutout-brand.mjs
import sharp from "sharp";

const jobs = [
  ["public/images/brand/stikr-black-side.webp", "public/images/product.png"],
  ["public/images/brand/stikr-pink-side.webp", "public/images/product-pink.png"],
  // Front views: strap-loop gaps are as small as the logo letters, so every enclosed light
  // patch is a hole except those inside a logo box (x0, y0, x1, y1): front logo, strap logo.
  ["public/images/brand/stikr-black-front.webp", "public/images/brand/cutout-black-front.png", { logos: [[330, 640, 660, 740], [60, 820, 150, 990]] }],
  ["public/images/brand/stikr-pink-front.webp", "public/images/brand/cutout-pink-front.png", { logos: [] }],
];

// Pixels lighter than this, connected to the image border, count as background.
const BG_MIN = 200;
// Light neutral greys (the floor shadow) count as background from this level up.
const SHADOW_MIN = 150;
// Neutral edge pixels at least this light, next to background, are fringe.
const FRINGE_MIN = 110;
// Enclosed light areas at least this many pixels are holes, not logo.
const MIN_HOLE = 2500;

for (const [src, out, opts = {}] of jobs) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const light = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const lo = Math.min(r, g, b);
    // Near-white, or the light neutral grey of the studio floor shadow.
    return lo >= BG_MIN || (lo >= SHADOW_MIN && Math.max(r, g, b) - lo < 14);
  };

  // Flood fill from the border so white logo text inside the bag is kept.
  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !light(i)) continue;
    bg[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }

  // Large enclosed white patches (inside the handle and drawstring loops) are background too;
  // small ones are the white logo letters and stay.
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || bg[start] || !light(start)) continue;
    const region = [];
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    const queue = [start];
    seen[start] = 1;
    while (queue.length) {
      const i = queue.pop();
      region.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n < 0 || n >= w * h || seen[n] || !light(n)) continue;
        seen[n] = 1;
        queue.push(n);
      }
    }
    const isHole = opts.logos
      ? !opts.logos.some(([a, b, c, d]) => x0 >= a && y0 >= b && x1 <= c && y1 <= d)
      : region.length >= MIN_HOLE;
    if (isHole) for (const i of region) bg[i] = 1;
  }

  // Peel the light anti-aliased fringe left along edges that touch the background.
  for (let pass = 0; pass < 6; pass++) {
    const grow = [];
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const lo = Math.min(r, g, b);
      if (bg[i] || lo < FRINGE_MIN || Math.max(r, g, b) - lo > 24) continue;
      const x = i % w;
      if ((x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || bg[i - w] || bg[i + w]) grow.push(i);
    }
    for (const i of grow) bg[i] = 1;
  }

  // Background becomes transparent; its grey floor shadow becomes a soft dark shadow.
  for (let i = 0; i < w * h; i++) {
    if (!bg[i]) continue;
    const lum = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
    const a = Math.max(0, Math.min(1, (250 - lum) / (250 - SHADOW_MIN)));
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
    data[i * 4 + 3] = Math.round(a * 140);
  }

  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 0 })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`${src} -> ${out}`);
}

// Black + pink combo: pink sits behind and to the left, black in front.
{
  const H = 1100;
  const black = await sharp("public/images/product.png").resize({ height: H }).toBuffer({ resolveWithObject: true });
  const pink = await sharp("public/images/product-pink.png").resize({ height: Math.round(H * 0.9) }).toBuffer({ resolveWithObject: true });
  const offset = Math.round(pink.info.width * 0.55);
  await sharp({
    create: { width: offset + black.info.width, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: pink.data, left: 0, top: H - pink.info.height },
      { input: black.data, left: offset, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile("public/images/product-duo.png");
  console.log("-> public/images/product-duo.png");
}
