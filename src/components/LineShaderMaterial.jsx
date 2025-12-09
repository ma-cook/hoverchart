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
  },
  // PERFORMANCE: Disable transparency since lines are fully opaque
  // This avoids expensive depth sorting for transparent objects
  transparent: false,
  depthTest: true,
  depthWrite: true,
});

export default LineShaderMaterial;
