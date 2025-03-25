import { Drawing } from '../base/Drawing.js';

// @run
class JFA extends Drawing {
    innerInitialize() {
    // _should_ be ceil.
    this.passes = Math.ceil(Math.log2(Math.max(this.width, this.height))) + 1;
    
    const {stage: seedStage, uniforms: seedUniforms, render: seedRender, renderTargets: seedRenderTargets} = this.initWebGL2({
    renderTargetOverrides: (this.width > 1024 || this.height > 1024) && !isMobile
        ? {
          internalFormat: this.gl.RG32F,
          format: this.gl.RG,
          type: this.gl.FLOAT,
        } : {
          internalFormat: this.gl.RG16F,
          type: this.gl.HALF_FLOAT,
          format: this.gl.RG,
        },
    uniforms: {
      resolution: [this.width, this.height],
      surfaceTexture: null,
    },
    fragmentShader: `
      precision highp float;
      uniform sampler2D surfaceTexture;
      uniform vec2 resolution;
      out vec2 FragColor;
    
      in vec2 vUv;
    
      void main() {
        float alpha = texelFetch(surfaceTexture, ivec2(gl_FragCoord.x, gl_FragCoord.y), 0).a;
        FragColor = vUv * ceil(alpha);
      }`,
    });
    
    const {stage: jfaStage, uniforms: jfaUniforms, render: jfaRender, renderTargets: jfaRenderTargets} = this.initWebGL2({
    renderTargetOverrides: (this.width > 1024 || this.height > 1024) && !isMobile
      ? {
        internalFormat: this.gl.RG32F,
        format: this.gl.RG,
        type: this.gl.FLOAT,
      } : {
        internalFormat: this.gl.RG16F,
        type: this.gl.HALF_FLOAT,
        format: this.gl.RG,
      },
    uniforms: {
      inputTexture: null,
      resolution: [this.width, this.height],
      oneOverSize: [1.0 / this.width, 1.0 / this.height],
      uOffset: Math.pow(2, this.passes - 1),
      direction: 0,
      index: false,
      passes: this.passes,
      skip: true,
    },
    fragmentShader: `
    precision highp float;
    uniform vec2 oneOverSize;
    uniform vec2 resolution;
    uniform sampler2D inputTexture;
    uniform float uOffset;
    uniform int direction;
    uniform bool skip;
    uniform int index;
    uniform int passes;
    
    const int MAX_TILE_SIZE = 32;
    
    const float SQRT_2 = 1.41;
    
    in vec2 vUv;
    out vec2 FragColor;
    
    void classic() {
    if (skip) {
    FragColor = vUv;
    } else {
    vec2 nearestSeed = vec2(-1.0);
    float nearestDist = 999999.9;
    vec2 pre = uOffset * oneOverSize;
    
    // Start with the center to try to appeal to loading in a block
    vec2 sampleUV = vUv;
    
    // Check if the sample is within bounds
    vec2 sampleValue = texture(inputTexture, sampleUV).xy;
    vec2 sampleSeed = sampleValue.xy;
    
    if (sampleSeed.x > 0.0 || sampleSeed.y > 0.0) {
    vec2 diff = sampleSeed - vUv;
    float dist = dot(diff, diff);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestSeed.xy = sampleValue.xy;
    }
    }
    
    // Then do the rest
    for (float y = -1.0; y <= 1.0; y += 1.0) {
    for (float x = -1.0; x <= 1.0; x += 1.0) {
      if (x == 0.0 && y == 0.0) { continue; }
      vec2 sampleUV = vUv + vec2(x, y) * pre;
    
      // Check if the sample is within bounds
      if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) { continue; }
    
        vec2 sampleValue = texture(inputTexture, sampleUV).xy;
        vec2 sampleSeed = sampleValue.xy;
    
        if (sampleSeed.x > 0.0 || sampleSeed.y > 0.0) {
          vec2 diff = sampleSeed - vUv;
          float dist = dot(diff, diff);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestSeed.xy = sampleValue.xy;
          }
        }
    }
    }
    
    FragColor = nearestSeed;
    }
    }
    
    void main() {
    classic();
    }
    `
    });
    
    this.seedStage = seedStage;
    this.seedUniforms = seedUniforms;
    this.seedRender = seedRender;
    this.seedRenderTargets = seedRenderTargets;
    
    this.jfaStage = jfaStage;
    this.jfaUniforms = jfaUniforms;
    this.jfaRender = jfaRender;
    this.jfaRenderTargets = jfaRenderTargets;
    }
    
    seedPass(inputTexture) {
    this.seedUniforms.surfaceTexture = inputTexture;
    this.renderer.setRenderTarget(this.seedRenderTargets[0]);
    this.seedRender();
    return this.seedRenderTargets[0].texture;
    }
    
    jfaPass(inputTexture) {
    let currentInput = inputTexture;
    
    let [renderA, renderB] = this.jfaRenderTargets;
    let currentOutput = renderA;
    this.jfaUniforms.skip = true;
    let passes = this.passes;
    
    for (let i = 0; i < passes || (passes === 0 && i === 0); i++) {
    
    const offset = Math.pow(2, this.passes - i - 1);
    // if (offset < 2.0) continue;
    this.jfaUniforms.skip = passes === 0;
    this.jfaUniforms.inputTexture = currentInput;
    // This intentionally uses `this.passes` which is the true value
    // In order to properly show stages using the JFA slider.
    this.jfaUniforms.uOffset = offset;
    this.jfaUniforms.direction = 0;
    this.jfaUniforms.index = i;
    
    this.renderer.setRenderTarget(currentOutput);
    this.jfaRender();
    
    currentInput = currentOutput.texture;
    currentOutput = (currentOutput === renderA) ? renderB : renderA;
    }
    
    return currentInput;
    }
    
    clear() {
    if (this.initialized) {
    this.seedRenderTargets.concat(this.jfaRenderTargets).forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    }
    super.clear();
    }
    
    renderPass() {
    let out = this.drawPass();
    out = this.seedPass(out);
    out = this.jfaPass(out);
    this.renderer.setRenderTarget(null);
    this.jfaRender();
    }
    }
