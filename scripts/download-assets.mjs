import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images");
const source = join(
  process.env.USERPROFILE,
  ".cursor",
  "projects",
  "c-Users-Abdul-Rehman-Khan-Documents-condos-and-home-angular",
  "agent-tools",
  "89fb2991-7a59-4412-b864-1598c2ecd8c1.txt",
);

const extras = {
  "hero.png": "https://www.figma.com/api/mcp/asset/4a6a14e1-76b3-4d87-907d-38ca5c3d26f5.png",
};

const names = {
  imgArrow6: "arrow-6.png",
  imgArrow7: "arrow-7.png",
  imgArrow8: "arrow-8.png",
  imgBeautifulYoungWomanDoingExerciseWithDumbbell2: "benefit-1.png",
  imgBeautifulYoungWomanDoingExerciseWithDumbbell3: "benefit-2.png",
  imgBeautifulYoungWomanDoingExerciseWithDumbbell4: "benefit-3.png",
  imgBeautifulYoungWomanDoingExerciseWithDumbbell5: "benefit-4.png",
  imgBeautifulYoungWomanDoingExerciseWithDumbbell6: "benefit-5.png",
  imgBeautifulYoungWomanDoingExerciseWithDumbbell1: "benefit-mask.svg",
  imgRectangle34624176: "color-stay.png",
  imgRectangle34624175: "color-move.png",
  imgRectangle34624178: "color-keep.png",
  imgRectangle34624179: "intro-product.png",
  imgLeatherMenSWomenSLeatherWallets1: "problem-1.png",
  imgLeatherMenSWomenSLeatherWallets2: "problem-2.png",
  imgLeatherMenSWomenSLeatherWallets3: "problem-3.png",
  imgRectangle13: "features-bg.png",
  imgUntitledDesign311: "product.png",
  imgEllipse3: "avatar-omar.png",
  imgEllipse4: "avatar-hana.png",
  imgEllipse5: "avatar-talal.png",
  imgEllipse6: "avatar-raquel.png",
  imgImage58: "testimonial-photo.png",
  imgGreenAbstractBackground2: "cta-texture.png",
  imgImg0489: "logo.png",
  imgGroup2820: "leader-1.svg",
  imgGroup2819: "leader-2.svg",
  imgGroup2829: "leader-3.svg",
  imgGroup2830: "leader-4.svg",
  imgGroup2825: "leader-5.svg",
  imgGroup2862: "carousel-next.svg",
  imgGroup2863: "carousel-prev.svg",
  imgGroup39869: "carousel-dots.svg",
  img: "quote.svg",
  imgGreenAbstractBackground1: "cta-mask.svg",
  imgLine15: "line.svg",
  imgCheckCircle: "check.svg",
};

const text = await readFile(source, "utf8");
const files = { ...extras };

for (const [key, filename] of Object.entries(names)) {
  const re = new RegExp(`const ${key} = "(https://www\\.figma\\.com/api/mcp/asset/[^"]+)"`);
  const match = text.match(re);
  if (!match) {
    console.warn("missing", key);
    continue;
  }
  files[filename] = match[1];
}

await mkdir(outDir, { recursive: true });

const results = await Promise.all(
  Object.entries(files).map(async ([name, url]) => {
    const res = await fetch(url);
    if (!res.ok) return `${name}: HTTP ${res.status}`;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(outDir, name), buf);
    return `${name}: ${buf.length} bytes`;
  }),
);

console.log(results.join("\n"));
console.log("count", results.length);
