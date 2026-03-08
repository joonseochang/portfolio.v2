#!/usr/bin/env node
// Compress a photo for use in the about panel carousel.
// Usage: node scripts/compress-photo.js input.jpg [output.webp]
// Output lands in public/images/ by default.
//
// Settings: max 1400px wide, WebP quality 82
// Preserves aspect ratio, never upscales.

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const [,, input, outputArg] = process.argv;

if (!input) {
  console.error('Usage: node scripts/compress-photo.js <input> [output.webp]');
  process.exit(1);
}

const inputPath = path.resolve(input);
const baseName = path.basename(inputPath, path.extname(inputPath));
const outputPath = outputArg
  ? path.resolve(outputArg)
  : path.join(__dirname, '../public/images', `${baseName}.webp`);

if (!fs.existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

sharp(inputPath)
  .resize({ width: 1400, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toFile(outputPath)
  .then(info => {
    const inputSize = (fs.statSync(inputPath).size / 1024).toFixed(0);
    const outputSize = (info.size / 1024).toFixed(0);
    console.log(`✓ ${path.basename(outputPath)}`);
    console.log(`  ${info.width}×${info.height}px`);
    console.log(`  ${inputSize}KB → ${outputSize}KB`);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
