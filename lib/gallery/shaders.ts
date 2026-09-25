export const vertex = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uStrength;
uniform float uTime;
uniform vec2 uViewportSizes;

varying vec2 vUv;
varying float vStrength;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

  float displacement = -uStrength;
  float frequency = 8.0 * (uStrength / 2.0);

  viewPosition.z += sin(viewPosition.x * frequency / uViewportSizes.x + uTime) * displacement
    + cos(viewPosition.y * frequency / uViewportSizes.y + uTime) * displacement;
  viewPosition.y += viewPosition.y * uStrength * uStrength;

  vUv = uv;
  vStrength = uStrength;

  gl_Position = projectionMatrix * viewPosition;
}
`;

export const fragment = `
precision highp float;

#define OCTAVES 1

uniform vec2 uImageSizes;
uniform vec2 uHoverSizes;
uniform vec2 uPlaneSizes;
uniform vec2 uViewportSizes;
uniform sampler2D tMap;
uniform sampler2D tHoverMap;
uniform float uProgress;
uniform float uReveal;

varying vec2 vUv;
varying float vStrength;

float random(in vec2 uv) {
  return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(in vec2 uv) {
  vec2 i = floor(uv);
  vec2 f = fract(uv);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(in vec2 uv) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < OCTAVES; i++) {
    value += amplitude * noise(uv);
    uv *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

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
  vec2 washUv = vUv;
  washUv.x *= uViewportSizes.x / uViewportSizes.y;

  vec3 wash = cos(vec3(0.9)) + fbm(washUv * atan(1.0));

  vec3 cover = texture2D(tMap, coverUv(vUv, uPlaneSizes, uImageSizes)).rgb;
  vec3 hover = texture2D(tHoverMap, coverUv(vUv, uPlaneSizes, uHoverSizes)).rgb;
  vec3 color = mix(cover, hover, uProgress);

  gl_FragColor = vec4(mix(color, wash, vec3(vStrength / 0.5)), uReveal);
}
`;
