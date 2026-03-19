precision highp float;

attribute vec3 instanceStart;  // Start point of the line
attribute vec3 instanceEnd;    // End point of the line
attribute vec3 instanceColor;  // Line color

uniform float linewidth;       // Line thickness
uniform vec2 resolution;       // Screen resolution
uniform float glowWidth;       // Multiplier for glow region (1.0 = no glow)

varying vec3 vColor;           // Pass color to fragment shader
varying float vEdgeDist;       // Perpendicular distance (-1..+1) across full quad width

void main() {
    // Transform start and end points using the model-view matrix
    vec4 start = modelViewMatrix * vec4(instanceStart, 1.0);
    vec4 end = modelViewMatrix * vec4(instanceEnd, 1.0);

    // Compute the direction of the line in clip space
    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;

    vec2 ndcDir = clipEnd.xy / clipEnd.w - clipStart.xy / clipStart.w;
    float len = length(ndcDir);
    vec2 dir = len > 0.0 ? ndcDir / len : vec2(1.0, 0.0);

    // Compute perpendicular direction for line thickness.
    // Expand by glowWidth so the quad is wide enough for the glow region.
    vec2 offset = vec2(-dir.y, dir.x) * linewidth * glowWidth / resolution.y;

    // Apply offset to the vertex position
    vec4 clipPosition = mix(clipStart, clipEnd, position.x);
    clipPosition.xy += offset * position.y * clipPosition.w;

    // Extend line past each endpoint by half the total width so that
    // adjacent segments overlap slightly, preventing visible gaps and
    // anti-aliasing fade at butt-end caps
    float extend = linewidth * glowWidth / resolution.y * 0.5;
    float extendSign = position.x * 2.0 - 1.0; // 0 → -1 (start), 1 → +1 (end)
    clipPosition.xy += dir * extend * extendSign * clipPosition.w;

    gl_Position = clipPosition;

    // Pass color and edge distance to the fragment shader
    vColor = instanceColor;
    vEdgeDist = position.y; // -1 at one edge, +1 at the other
}