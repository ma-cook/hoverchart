precision highp float;

uniform float opacity;        // Line opacity
uniform float glowWidth;      // Glow region multiplier (1.0 = no glow)
uniform float glowIntensity;  // Peak brightness of the glow (0.0–1.0)

varying vec3 vColor;          // Color passed from vertex shader
varying float vEdgeDist;      // Perpendicular position (-1..+1)

void main() {
    float dist = abs(vEdgeDist);

    // coreEdge is the normalized boundary of the solid line.
    // With glowWidth=3 the core occupies the inner 1/3 of the quad.
    float coreEdge = 1.0 / glowWidth;

    float alpha;
    if (dist <= coreEdge) {
        // Inside core line — fully opaque with a soft anti-aliased edge
        alpha = 0.5;
    } else {
        // Glow region — exponential falloff from the core edge outward
        float t = (dist - coreEdge) / (1.0 - coreEdge); // 0 at core edge, 1 at quad edge
        alpha = glowIntensity * exp(-t * 4.0);
    }

    // Bright glow bleed: slightly boost color toward white near the core
    float brightBoost = (1.0 - smoothstep(0.0, coreEdge * 2.0, dist)) * 0.10;
    vec3 col = min(vColor + brightBoost, vec3(1.0));

    gl_FragColor = vec4(col, opacity * alpha);
}