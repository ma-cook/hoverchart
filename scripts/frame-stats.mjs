import sharp from 'sharp';

const [,, file] = process.argv;
const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const colorMap = new Map();
let nonBg = 0;
let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (!(r > 225 && g > 225 && b > 225)) {
      nonBg++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
console.log(`${file}: ${info.width}x${info.height} nonBg=${nonBg} bbox=x[${minX},${maxX}] y[${minY},${maxY}]`);
const top = [...colorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log('top colors:', top.map(([c, n]) => `rgb(${c})=${n}`).join(' | '));
