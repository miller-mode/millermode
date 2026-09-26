export const vertex = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragment = `
precision highp float;

uniform vec2 uImageSizes;
uniform vec2 uHoverSizes;
uniform vec2 uPlaneSizes;
uniform sampler2D tMap;
uniform sampler2D tHoverMap;
uniform float uProgress;
uniform float uReveal;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 plane, vec2 image) {
  vec2 ratio = vec2(
    min((plane.x / plane.y) / (image.x / image.y), 1.0),
    min((plane.y / plane.x) / (image.y / image.x), 1.0)
  );

  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  vec3 cover = texture2D(tMap, coverUv(vUv, uPlaneSizes, uImageSizes)).rgb;
  vec3 hover = texture2D(tHoverMap, coverUv(vUv, uPlaneSizes, uHoverSizes)).rgb;

  gl_FragColor = vec4(mix(cover, hover, uProgress), uReveal);
}
`;
