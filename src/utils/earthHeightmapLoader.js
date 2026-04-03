// Loads an equirectangular heightmap image and exposes it as pixel data
// for the terrain generator. Expects a grayscale or hypsometric PNG where
// the red channel encodes elevation (0 = deepest ocean, 255 = highest peak).

export async function loadEarthHeightmap(url = '/earthHeightmap.png') {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve({
        data: imageData.data,
        width: img.width,
        height: img.height,
      });
    };
    // Heightmap is optional — resolve null so the fallback model is used
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
