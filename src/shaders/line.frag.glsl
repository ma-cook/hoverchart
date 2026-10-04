precision highp float;

uniform float opacity;
uniform float glowWidth;
uniform float glowIntensity;

varying vec3 vColor;
varying float vEdgeDist;
varying vec3 vViewDir;

void main() {
    // dist: 0 at the centreline, 1 at the outer edge of the expanded quad.
    float dist = abs(vEdgeDist);

    // Half-width of the solid core, in the same units.
    float coreEdge = 1.0 / glowWidth;

    // Segments running across the view axis (|z| ~ 0) are seen edge-on and
    // catch more light, so they read brighter -- the same cue as a fresnel rim.
    float fresnel = pow(1.0 - abs(vViewDir.z), 2.0);

    // Solid core, feathered across the outer part of the core band rather than
    // hard-stepped: the previous `if` left a visible seam at the boundary.
    float core = 1.0 - smoothstep(coreEdge * 0.45, coreEdge, dist);

    // Halo measured outward from the core edge. exp(-t * k) with t clamped at 0
    // is already continuous across coreEdge, so the only thing needed is a
    // cross-fade, otherwise it piles onto the core's flat top.
    float t = max(dist - coreEdge, 0.0) / max(1.0 - coreEdge, 1e-4);
    float lobeTight = exp(-t * 7.0);
    float lobeWide = exp(-t * 2.0);
    float haloMix = smoothstep(coreEdge * 0.45, coreEdge, dist);
    float halo = (lobeTight * 0.6 + lobeWide * 0.4) * glowIntensity * haloMix;

    // Core and halo share the cross-fade interval on purpose. Fading the core out
    // over a wider band than the halo fades in lets the two separate and opens a
    // dark ring between them; sharing the interval keeps the ramp monotonic.
    float alpha = core * 0.9 + halo * (0.75 + fresnel * 0.25);

    // Whitening is squared, so it concentrates on the centreline, and the wide
    // lobe tints toward the object's own colour rather than pure white.
    vec3 col = mix(vColor, vec3(1.0), core * core * 0.35);
    col += vColor * lobeWide * 0.15 * haloMix;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * opacity);
}
