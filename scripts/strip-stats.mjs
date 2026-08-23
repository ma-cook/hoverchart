import sharp from 'sharp';

const files = process.argv.slice(2);
for (const file of files) {
  const { data, info } = await sharp(file)
    .extract({ left: 400, top: 250, width: 800, height: 400 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let dark = 0;
  let minRowDark = null;
  const rowCounts = [];
  for (let y = 0; y < info.height; y++) {
    let inRow = 0;
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i] + data[i + 1] + data[i + 2] < 480) inRow++;
    }
    rowCounts.push(inRow);
    dark += inRow;
  }
  const maxRow = Math.max(...rowCounts);
  console.log(`${file}: stripDark=${dark} maxRowDark=${maxRow}`);
}
