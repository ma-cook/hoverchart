precision highp float;

attribute vec3 instanceStart;  // Start point of the line
attribute vec3 instanceEnd;    // End point of the line
attribute vec3 instanceColor;  // Line color

uniform float linewidth;       // Line thickness
uniform vec2 resolution;       // Screen resolution

varying vec3 vColor;           // Pass color to fragment shader

void main() {
    // Transform start and end points using the model-view matrix
    vec4 start = modelViewMatrix * vec4(instanceStart, 1.0);
    vec4 end = modelViewMatrix * vec4(instanceEnd, 1.0);

    // Compute the direction of the line in clip space
    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;

    vec2 dir = normalize(clipEnd.xy / clipEnd.w - clipStart.xy / clipStart.w);

    // Compute perpendicular direction for line thickness
    vec2 offset = vec2(-dir.y, dir.x) * linewidth / resolution.y;

    // Apply offset to the vertex position
    vec4 clipPosition = mix(clipStart, clipEnd, position.x);
    clipPosition.xy += offset * position.y * clipPosition.w;

    gl_Position = clipPosition;

    // Pass color to the fragment shader
    vColor = instanceColor;
}