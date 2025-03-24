// @run id="naive-raymarch-shader" type="x-shader/x-fragment"
const naive_raymarch_shader = `
uniform sampler2D sceneTexture;
uniform sampler2D distanceTexture;
uniform sampler2D gradientTexture;
uniform float rayCount;
uniform float maxSteps;
uniform bool showNoise;
uniform bool accumRadiance;
uniform float srgb;
uniform vec2 resolution;
const int maxBounces = 2;

in vec2 vUv;
out vec4 FragColor;

const float PI = 3.14159265;
const float TAU = 2.0 * PI;
const float EPSILON = 1e-6;
const float BIAS = 1e-4;

float rand(vec2 co) {
return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 gradient(vec2 uv) {
return textureLod(gradientTexture, uv, 0.0).xy;
}

vec2 doReflect(vec2 rayDir, vec2 normal) {
return rayDir - 2.0 * dot(rayDir, normal) * normal;
}

vec4 raymarch() {
float rays = 256.0;
vec2 oneOverSize = 1.0 / resolution;
vec2 ratio = normalize(oneOverSize);
float minStepSize = min(oneOverSize.x, oneOverSize.y) * 0.5;
float oneOverRayCount = 1.0 / rays;
float tauOverRayCount = TAU * oneOverRayCount;

// Different noise every pixel
float noise = showNoise ? rand(vUv) : 0.1;

vec4 radiance = vec4(0.0, 0.0, 0.0, 1.0);
float transmittance = 1.0;

// Shoot rays in "rayCount" directions, equally spaced, with some randomness.
for(int i = 0; i < int(rays); i++) {
float angle = tauOverRayCount * (float(i) + 0.5 + noise);
vec2 rayDirection = vec2(cos(angle), -sin(angle));
vec2 sampleUv = vUv;

int initialStep = accumRadiance ? 0 : max(0, int(maxSteps) - 1);
float stepSize = 1.0;

int bounceCount = 0;

for (int step = initialStep; step < int(maxSteps); step += int(stepSize)) {
// How far away is the nearest object?
float dist = textureLod(distanceTexture, sampleUv, 0.0).r;

// Go the direction we're traveling (with noise)
sampleUv += rayDirection * dist * ratio;

if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
  break;
}

if (dist <= minStepSize) {
  vec4 sampleLight = textureLod(sceneTexture, sampleUv, 0.0);

  if (length(sampleLight.rgb) == 0.0) {
    bounceCount++;
    if (bounceCount > maxBounces) {
      break;
    }
    rayDirection = doReflect(rayDirection, gradient(sampleUv));
    sampleUv += rayDirection * (dist + minStepSize);

    step = 0;
  } else if (length(sampleLight.rgb) > 0.0) {
    radiance += pow(0.9, float(bounceCount)) * vec4(pow(sampleLight.rgb, vec3(srgb)), 1.0);
    break;
  }
}
}
}

// Average radiance
return radiance * oneOverRayCount;
}

void main() {
FragColor = vec4(pow(raymarch().rgb, vec3(1.0 / srgb)), 1.0);
}
`;

export default naive_raymarch_shader;
