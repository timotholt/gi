// <script data-run-id="b7d5a6ac-d899-4f10-9b04-7744ce4ada4a"  id="volumetric-rc-fragment" type="x-shader/x-fragment">
// @run id="volumetric-rc-fragment" type="x-shader/x-fragment"
const volumetric_rc_fragment = `
uniform vec2 resolution;
uniform sampler2D sceneTexture;
uniform sampler2D lastTexture;
uniform vec2 cascadeExtent;
uniform float cascadeCount;
uniform float cascadeIndex;
uniform float basePixelsBetweenProbes;
uniform float cascadeInterval;
uniform float rayInterval;
uniform float intervalOverlap;
uniform bool bilinearFixEnabled;
uniform bool addNoise;
uniform bool enableSun;
uniform bool painterly;
uniform bool disableMips;
uniform bool nonLinearAccumulation;
uniform float sunAngle;
uniform float srgb;
uniform float firstCascadeIndex;
uniform float lastCascadeIndex;
uniform float baseRayCount;
uniform float dpr;
uniform float time;

in vec2 vUv;
out vec4 FragColor;

const float SQRT_2 = 1.41;
const float PI = 3.14159265;
const float TAU = 2.0 * PI;
const float goldenAngle = PI * 0.7639320225;
const float sunDistance = 1.0;

const vec3 skyColor = vec3(0.2, 0.24, 0.35) * 3.0;
const vec3 sunColor = vec3(0.95, 0.9, 0.8) * 3.0;

const vec3 oldSkyColor = vec3(0.02, 0.08, 0.2);
const vec3 oldSunColor = vec3(0.95, 0.95, 0.9);

vec3 oldSunAndSky(float rayAngle) {
// Get the sun / ray relative angle
float angleToSun = mod(rayAngle - sunAngle, TAU);

// Sun falloff based on the angle
float sunIntensity = smoothstep(1.0, 0.0, angleToSun);

// And that's our sky radiance
return oldSunColor * sunIntensity + oldSkyColor;
}

vec3 sunAndSky(float rayAngle) {
// Get the sun / ray relative angle
float angleToSun = mod(rayAngle - sunAngle, TAU);

// Sun falloff
float sunIntensity = pow(max(0.0, cos(angleToSun)), 4.0 / sunDistance);

return mix(sunColor * sunIntensity, skyColor, 0.3);
}

float rand(vec2 co) {
return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec4 safeTextureSample(sampler2D tex, vec2 uv, float lod) {
vec4 color = texture(tex, uv);
return vec4(color.rgb, color.a);
}

vec4 colorSample(sampler2D tex, vec2 uv, bool srgbSample, float mipLevel) {
vec4 color = vec4(0);
if (disableMips) {
color = textureLod(tex, uv, 0.0);
} else {
color = textureLod(tex, uv, mipLevel);
}
if (!srgbSample) {
return color;
}
return vec4(pow(color, vec4(srgb)));
}

vec4 accumulateSample(vec4 acc, vec4 sampleColor, float stepSize) {
float transparency = 1.0 - sampleColor.a;
return vec4(
  acc.rgb + acc.a * sampleColor.rgb,
  transparency * acc.a
);
}

vec4 raymarch(vec2 rayStart, vec2 rayEnd, vec2 oneOverSize) {
vec2 rayDir = normalize(rayEnd - rayStart);
float rayLength = length(rayEnd - rayStart);
vec2 rayUv = rayStart * oneOverSize;

vec4 radiance = vec4(0.0, 0.0, 0.0, 1.0);
float transmittance = 1.0;

int maxSteps = 500;
int steps = 0;

float mipLevel = cascadeIndex;
float stepSize = pow(2.0, mipLevel - 2.0);
vec2 delta = rayDir * stepSize * oneOverSize;

for (float dist = 0.0; dist < rayLength && steps <= maxSteps; steps++) {
  if (any(lessThan(rayUv, vec2(0.0))) || any(greaterThan(rayUv, vec2(1.0))))
      break;

  vec4 color = colorSample(sceneTexture, rayUv, true, (mipLevel - 2.0) + (dist / rayLength));

  if (nonLinearAccumulation) {
    // Exponential
    transmittance *= exp(-color.a);
  } else {
    // Linear
    transmittance *= 1.0 - color.a;
  }

  float coef = transmittance == 1.0
    ? stepSize
    : (
      pow(transmittance, stepSize) - 1.0
    ) / (transmittance - 1.0);
  radiance.rgb += radiance.a * color.rgb * coef;
  radiance.a *= pow(transmittance, stepSize);

  rayUv += delta;
  dist += stepSize;
}

return radiance;
}

vec2 getUpperCascadeTextureUv(float index, vec2 offset, float spacingBase) {
float upperSpacing = pow(spacingBase, cascadeIndex + 1.0);
vec2 upperSize = floor(cascadeExtent / upperSpacing);
vec2 upperPosition = vec2(
mod(index, upperSpacing),
floor(index / upperSpacing)
) * upperSize;

vec2 r = vec2(0);

if (painterly) {
r = pow(1.0, cascadeIndex) * (
vec2(
    rand(vUv * (0.2 + cascadeIndex)),
    rand(vUv * (0.1 + cascadeIndex))
) * 2.0 - 1.0
) * 0.5;
}

upperPosition += r;

vec2 clamped = clamp(offset, vec2(0.5 - r), upperSize - r - 0.5);
return (upperPosition + clamped) / cascadeExtent;
}

vec4 merge(vec4 currentRadiance, float index, vec2 position, float spacingBase, vec2 localOffset) {
// Early return conditions
if (cascadeIndex >= cascadeCount - 1.0) {
return currentRadiance;
}

// Calculate the position within the upper cascade cell
vec2 offset = (position + localOffset) / spacingBase;
float spacing = pow(spacingBase, cascadeIndex);

vec2 upperProbePosition = getUpperCascadeTextureUv(index, offset, spacingBase);

// Sample from the upper cascade
vec4 upperSample = textureLod(
lastTexture,
upperProbePosition,
0.0
);

//  float t = 1.0 - exp(-currentRadiance.a * pow(2.0, cascadeIndex));

return vec4(
  currentRadiance.rgb + (currentRadiance.a * upperSample.rgb),
  upperSample.a * currentRadiance.a
);

}

void main() {
vec2 coord = floor(vUv * cascadeExtent);

float base = baseRayCount;
float rayCount = pow(base, cascadeIndex + 1.0);
float spacingBase = sqrt(baseRayCount);
float spacing = pow(spacingBase, cascadeIndex);

// Hand-wavy rule that improved smoothing of other base ray counts
float modifierHack = base < 16.0 ? pow(basePixelsBetweenProbes, 1.0) : spacingBase;

vec2 size = floor(cascadeExtent / spacing);
vec2 probeRelativePosition = mod(coord, size);
vec2 rayPos = floor(coord / size);

float partialInterval = modifierHack * cascadeInterval;

float modifiedInterval = 1.41 * partialInterval * rayInterval;

float start = modifiedInterval * (cascadeIndex == 0.0 ? 0.0 : pow(base, (cascadeIndex - 1.0)));
float end = (1.0 + 3.0 * intervalOverlap) * (pow(base, cascadeIndex) * modifiedInterval);

vec2 interval = vec2(start, end);

vec2 probe0 = (probeRelativePosition) * basePixelsBetweenProbes * spacing;
vec2 probeCenter = (probeRelativePosition + 0.5) * basePixelsBetweenProbes * spacing;

float preAvgAmt = baseRayCount;

// Calculate which set of rays we care about
float baseIndex = (rayPos.x + (spacing * rayPos.y)) * preAvgAmt;
// The angle delta (how much it changes per index / ray)
float angleStep = TAU / rayCount;

vec2 oneOverSize = 1.0 / resolution;
float maxExtent = max(resolution.x, resolution.y);
float avgRecip = 1.0 / (preAvgAmt);

vec2 normalizedProbeCenter = probeCenter * oneOverSize;

vec4 totalRadiance = vec4(0.0);
float noise = addNoise ? rand(vUv * (cascadeIndex + 1.0)) : 0.0;

vec4 mergedRadiance = vec4(0.0);
vec4 radiances[4] = vec4[4](vec4(0), vec4(0), vec4(0), vec4(0));
float upperSpacing = pow(spacingBase, cascadeIndex + 1.0);
vec2 upperSize = floor(cascadeExtent / upperSpacing);
vec2 upperProbeRelativePosition = mod(coord, upperSize);
vec2 upperProbeCenter = (upperProbeRelativePosition + 0.5) * basePixelsBetweenProbes * upperSpacing;

vec2 offset = (probeCenter / upperProbeCenter);
vec2 weight = fract(offset);

for (int i = 0; i < int(preAvgAmt); i++) {
  float index = baseIndex + float(i);
  float angle = (index + 0.5 + noise) * angleStep;
  vec2 rayDir = vec2(cos(angle), -sin(angle));
  vec2 rayStart = probeCenter + rayDir * interval.x;
  if (bilinearFixEnabled) {
    for (int j = 0; j < 4; j++) {
      vec2 jOffset = (vec2(j % 2, j / 2)) * spacingBase;

      radiances[j] = raymarch(
        probeCenter + rayDir * interval.x,
        upperProbeCenter + jOffset + rayDir * interval.y,
        oneOverSize
      );

      radiances[j] = merge(
        radiances[j],
        index,
        probeRelativePosition,
        spacingBase,
        vec2(jOffset)
      );
    }

    mergedRadiance = mix(
      mix(radiances[0], radiances[1], weight.x),
      mix(radiances[2], radiances[3], weight.x),
      weight.y
    );
  } else {

      vec2 rayEnd = probeCenter + rayDir * interval.y;

      vec4 raymarched = raymarch(rayStart, rayEnd, oneOverSize);
      mergedRadiance = merge(
          raymarched, index, probeRelativePosition, spacingBase, vec2(0.5)
      );

  }

  if (enableSun && cascadeIndex >= cascadeCount - 1.0) {
    mergedRadiance.rgb += sunAndSky(angle) * mergedRadiance.a;
  }

  totalRadiance += mergedRadiance * avgRecip;
}

FragColor = (cascadeIndex > firstCascadeIndex)
  ? vec4(totalRadiance.rgb, totalRadiance.a)
  : vec4(pow(totalRadiance, vec4(1.0 / srgb)));
}`;

export default volumetric_rc_fragment;