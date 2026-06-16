precision highp float;

uniform float opacity;
uniform float glowWidth;
uniform float glowIntensity;

varying vec3 vColor;
varying float vEdgeDist;
varying vec3 vViewDir;

void main() {
    float dist = abs(vEdgeDist);

    float coreEdge = 1.0 / glowWidth;

    float fresnel = pow(1.0 - abs(vViewDir.z), 2.0);

    float alpha;
    if (dist <= coreEdge) {
        alpha = 0.5 + fresnel * 0.15;
    } else {
        float t = (dist - coreEdge) / (1.0 - coreEdge);
        float glowFalloff = exp(-t * 4.0);
        alpha = glowIntensity * glowFalloff * (1.0 + fresnel * 0.3);
    }

    float brightBoost = (1.0 - smoothstep(0.0, coreEdge * 2.0, dist)) * 0.15;
    vec3 col = min(vColor + brightBoost, vec3(1.0));

    gl_FragColor = vec4(col, opacity * alpha);
}
