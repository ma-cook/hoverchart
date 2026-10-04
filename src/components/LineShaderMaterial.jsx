import { ShaderMaterial } from 'three';
import vertexShader from '../shaders/line.vert.glsl';
import fragmentShader from '../shaders/line.frag.glsl';

const LineShaderMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    linewidth: { value: 1 },
    resolution: { value: { x: window.innerWidth, y: window.innerHeight } },
    opacity: { value: 1.0 },
    glowWidth: { value: 5.0 },      // Quad expansion factor (1 = no glow, higher = wider halo)
    glowIntensity: { value: 0.85 }, // Peak glow alpha where the halo meets the core
  },
  transparent: true,
  depthTest: true,
  depthWrite: false, // Avoid depth-fight artifacts with transparent glow
});

export default LineShaderMaterial;
