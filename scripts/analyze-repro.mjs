import sharp from 'sharp';

const [,, file] = process.argv;
const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });

// Histogram of pixel classes across full frame
let bg = 0, dark = 0, green = 0, blue = 0, other = 0;
let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 225 && g > 225 && b > 225) { bg++; continue; }
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (r + g + b < 450) { dark++; }
    else if (g > 130 && r < 150 && b < 150) { green++; }
    else if (b > 130 && r < 150 && g < 180) { blue++; }
    else other++;
  }
}
console.log(`${file}:`);
console.log(`  bg=${bg} dark=${dark} green=${green} blue=${blue} other=${other}`);
console.log(`  non-bg bbox: x=[${minX},${maxX}] y=[${minY},${maxY}]`);

// Find long horizontal runs of dark pixels (candidate connection lines)
let bestRun = 0, bestRow = -1;
for (let y = Math.floor(info.height * 0.25); y < info.height * 0.75; y++) {
  let run = 0, maxRun = 0;
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    if (data[i] + data[i + 1] + data[i + 2] < 550) { run++; if (run > maxRun) maxRun = run; }
    else run = 0;
  }
  if (maxRun > bestRun) { bestRun = maxRun; bestRow = y; }
}
console.log(`  longest horizontal dark run: ${bestRun}px at y=${bestRow}`);
