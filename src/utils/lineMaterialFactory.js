import LineShaderMaterial from '../components/LineShaderMaterial';

/**
 * Create an independent clone of the shared line material with every uniform
 * configured synchronously.  Cloning in a render body and applying glow
 * overrides in a later effect leaves one frame of the default glow, which is
 * what caused connection lines to flash the halo before going plain.
 *
 * @param {object}  [options]
 * @param {number}  [options.lineWidth]      Core line width in pixels.
 * @param {number}  [options.glowWidth]      Quad expansion factor (1 = no halo).
 * @param {number}  [options.glowIntensity]  Peak halo alpha (0 = disabled).
 * @param {number}  [options.opacity]        Global opacity.
 * @param {{x:number,y:number}} [options.resolution] Initial viewport size.
 * @returns {import('three').ShaderMaterial}
 */
export function createLineMaterial({
  lineWidth,
  glowWidth,
  glowIntensity,
  opacity,
  resolution,
} = {}) {
  const material = LineShaderMaterial.clone();

  if (lineWidth != null) material.uniforms.linewidth.value = lineWidth;
  if (glowWidth != null) material.uniforms.glowWidth.value = glowWidth;
  if (glowIntensity != null) material.uniforms.glowIntensity.value = glowIntensity;
  if (opacity != null) material.uniforms.opacity.value = opacity;
  if (resolution) {
    material.uniforms.resolution.value.set(resolution.x, resolution.y);
  }

  return material;
}

export default createLineMaterial;
