precision highp float;

uniform float opacity; // Line opacity

varying vec3 vColor;   // Color passed from vertex shader

void main() {
    gl_FragColor = vec4(vColor, opacity);
}