import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(__dirname, '../assets');

// ─── SVG definitions ──────────────────────────────────────

/** App icon: 1024×1024 — blue background + bold white bolt */
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A73C8"/>
      <stop offset="100%" stop-color="#2B9EE8"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Bold lightning bolt (upward-pointing) -->
  <polygon
    points="575,115 310,545 500,545 445,905 715,475 515,475"
    fill="white"
    opacity="0.97"
  />

  <!-- Small accent dot below bolt tip -->
  <circle cx="480" cy="930" r="28" fill="white" opacity="0.4"/>
</svg>`;

/** Adaptive icon (Android): foreground on transparent bg — bolt only, bigger padding */
const adaptiveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A73C8"/>
      <stop offset="100%" stop-color="#2B9EE8"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg2)"/>
  <polygon
    points="575,115 310,545 500,545 445,905 715,475 515,475"
    fill="white"
    opacity="0.97"
  />
</svg>`;

/** Splash icon: 200×200 bolt centred on transparent — placed on brand-blue bg in app.json */
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A73C8"/>
      <stop offset="100%" stop-color="#2B9EE8"/>
    </linearGradient>
  </defs>
  <!-- Outer glow ring -->
  <circle cx="256" cy="256" r="240" fill="#2B9EE8" opacity="0.15"/>
  <!-- Main circle -->
  <circle cx="256" cy="256" r="210" fill="url(#bg3)"/>
  <!-- Bolt -->
  <polygon
    points="290,68 158,272 248,272 222,452 358,238 258,238"
    fill="white"
    opacity="0.97"
  />
</svg>`;

/** Favicon: simple bolt on blue */
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="10" fill="#2B9EE8"/>
  <polygon points="27,4 13,25 23,25 21,44 35,23 25,23" fill="white"/>
</svg>`;

// ─── Generate ─────────────────────────────────────────────

async function generate(svgString, outputPath, width, height) {
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`✓ ${outputPath.replace(assetsDir, 'assets')}`);
}

await generate(iconSvg,     `${assetsDir}/icon.png`,              1024, 1024);
await generate(adaptiveSvg, `${assetsDir}/adaptive-icon.png`,     1024, 1024);
await generate(splashSvg,   `${assetsDir}/splash-icon.png`,        512,  512);
await generate(faviconSvg,  `${assetsDir}/favicon.png`,             48,   48);
await generate(iconSvg,     `${assetsDir}/notification-icon.png`,  192,  192);

console.log('\nAll assets generated successfully!');
