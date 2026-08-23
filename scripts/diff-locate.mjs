import sharp from 'sharp';

const [,, fileA, fileB] = process.argv;
const [a, b] = await Promise.all([
  sharp(fileA).raw().toBuffer({ resolveWithObject: true }),
  sharp(fileB).raw().toBuffer({ resolveWithObject: true }),
]);
const { data, info } = a;
let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1, count = 0;
// row/col profiles
const rows = new Array(info.height).fill(0);
const cols = new Array(info.width).fill(0);
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    let d = 0;
    for (let c = 0; c < info.channels; c++) d += Math.abs(data[i + c] - b.data[i + c]);
    if (d > 72) {
      count++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      rows[y]++; cols[x]++;
    }
  }
}
console.log(`diff ${fileB} vs ${fileA}: px=${count} bbox=x[${minX},${maxX}] y[${minY},${maxY}]`);
const topRows = rows.map((v, i) => [i, v]).filter(([, v]) => v > 30);
console.log('hot rows:', JSON.stringify(topRows.slice(0, 20)));

// What's in image A outside background?
let nMinX = Infinity, nMaxX = -1, nMinY = Infinity, nMaxY = -1, nonBg = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const r = data[i], g = data[i + 1], bl = data[i + 2];
    const isBg = r > 225 && g > 225 && bl > 225;
    // top bar is dark UI — exclude y<70 from "scene content" report
    if (!isBg && y >= 70) {
      nonBg++;
      if (x < nMinX) nMinX = x; if (x > nMaxX) nMaxX = x;
      if (y < nMinY) nMinY = y; if (y > nMaxY) nMaxY = y;
    }
  }
}
console.log(`${fileA}: sceneContentPx=${nonBg} bbox=x[${nMinX},${nMaxX}] y[${nMinY},${nMaxY}]`);
