precision highp float;

attribute vec3 instanceStart;
attribute vec3 instanceEnd;
attribute vec3 instanceColor;

uniform float linewidth;
uniform vec2 resolution;
uniform float glowWidth;

varying vec3 vColor;
varying float vEdgeDist;
varying vec3 vViewDir;

void main() {
    vec4 start = modelViewMatrix * vec4(instanceStart, 1.0);
    vec4 end = modelViewMatrix * vec4(instanceEnd, 1.0);

    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;

    vec2 ndcDir = clipEnd.xy / clipEnd.w - clipStart.xy / clipStart.w;
    float len = length(ndcDir);
    vec2 dir = len > 0.0 ? ndcDir / len : vec2(1.0, 0.0);

    vec2 offset = vec2(-dir.y, dir.x) * linewidth * glowWidth / resolution.y;

    vec4 clipPosition = mix(clipStart, clipEnd, position.x);
    clipPosition.xy += offset * position.y * clipPosition.w;

    float extend = linewidth * glowWidth / resolution.y * 0.5;
    float extendSign = position.x * 2.0 - 1.0;
    clipPosition.xy += dir * extend * extendSign * clipPosition.w;

    gl_Position = clipPosition;

    vColor = instanceColor;
    vEdgeDist = position.y;

    vec3 viewDir = normalize(end.xyz / end.w - start.xyz / start.w);
    vViewDir = viewDir;
}
