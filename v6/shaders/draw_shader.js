const draw_shader = `
  // @run id="draw-shader" type="x-shader/x-fragment"
  uniform sampler2D asciiTexture;
  uniform sampler2D inputTexture;
  uniform vec4 color;
  uniform vec2 from;
  uniform float scale;
  uniform float dpr;
  uniform float time;
  uniform vec2 to;
  uniform vec2 resolution;
  uniform bool drawing;
  uniform bool indicator;
  uniform float character;

  // Constants from constants.js
  const float CHAR_PIXEL_SIZE = 8.0;
  const float GRID_SIZE = 16.0;
  const float TEXTURE_SIZE = 128.0;

  const bool randomness = false;

  in vec2 vUv;
  out vec4 FragColor;

  float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
  float coef = scale;

  vec4 current = randomness ? vec4(0) : textureLod(inputTexture, vUv, 0.0);
  if (drawing || randomness) {
  // Calculate the grid size
  vec2 guv = vUv - 0.5 / GRID_SIZE;

  // Calculate the grid position (0 to 15 in both x and y)
  vec2 gridPos = floor(guv * GRID_SIZE);

  // Calculate the position within the character
  vec2 charPos = fract(guv * GRID_SIZE) * CHAR_PIXEL_SIZE;

  // Mouse pos
  vec2 mouseUv = from / resolution;
  vec2 mouseGridPos = floor((mouseUv - 0.5 / GRID_SIZE) * GRID_SIZE);

  float ch = character;

  if (randomness) {
    if (mod(gridPos.x, 2.0) == 0.0 && mod(gridPos.y, 2.0) == 0.0) {
        ch = floor(rand(gridPos * time / 100.0) * TEXTURE_SIZE);
    } else {
        ch = 0.0;
    }
  }

  // Calculate the UV coordinates for the texture
  // Inverted y-axis
  vec2 uv = vec2(
  (mod(ch, GRID_SIZE) * CHAR_PIXEL_SIZE + charPos.x) / TEXTURE_SIZE,
  ((15.0 - floor(ch / GRID_SIZE)) * CHAR_PIXEL_SIZE + charPos.y) / TEXTURE_SIZE
  );

  if (randomness || gridPos == mouseGridPos) {
    // Sample the texture
    vec4 char = texture(asciiTexture, uv);
    if (char.a > 0.0) {
      vec3 c = color.rgb;
      if (randomness) {
          float r = rand(gridPos * 0.1 * time / 100.0);
          float g = rand(gridPos * 0.2 * time / 100.0);
          float b = rand(gridPos * 0.3 * time / 100.0);
          c = rand(gridPos * 0.4 * time / 100.0) > 0.5 ? vec3(0) : vec3(r, g, b);
      }
      current = char * vec4(c * color.a, color.a);
    }
  }
  }

  FragColor = current;
}
`;

export default draw_shader;