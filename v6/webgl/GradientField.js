import DistanceField from "./DistanceField.js";

// @run
class GradientField extends DistanceField {
  innerInitialize() {
    super.innerInitialize();

    const {
      stage: gfStage,
      uniforms: gfUniforms,
      render: gfRender,
      renderTargets: gfRenderTargets,
    } = this.initWebGL2({
      uniforms: {
        resolution: [this.width, this.height],
        distanceTexture: null,
      },
      renderTargetOverrides: {
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        internalFormat: this.gl.RG16F,
        format: this.gl.RG,
        type: this.gl.HALF_FLOAT,
      },
      fragmentShader: `
        uniform sampler2D distanceTexture;
        uniform vec2 resolution;
      
        in vec2 vUv;
        out vec2 FragColor;
        
        vec2 calculateGradient(vec2 uv) {
          vec2 texelSize = 1.0 / resolution;
          
          // Sample the distance field at multiple mipmap levels
          float c = textureLod(distanceTexture, uv, 0.0).r;
          float l = textureLod(distanceTexture, uv - vec2(texelSize.x, 0.0), 0.0).r;
          float r = textureLod(distanceTexture, uv + vec2(texelSize.x, 0.0), 0.0).r;
          float b = textureLod(distanceTexture, uv - vec2(0.0, texelSize.y), 0.0).r;
          float t = textureLod(distanceTexture, uv + vec2(0.0, texelSize.y), 0.0).r;
          
          // Calculate gradient using central differences
          return vec2(r - l, t - b) * 0.5;
        }
        
        void main() {
          vec2 gradient = calculateGradient(vUv);
          
          // Normalize the gradient
          FragColor = normalize(gradient);
        }`,
    });

    this.gfStage = gfStage;
    this.gfUniforms = gfUniforms;
    this.gfRender = gfRender;
    this.gfRenderTargets = gfRenderTargets;
    this.prev = 0;
    this.hasRendered = false;
  }

  clear() {
    if (this.initialized) {
      this.gfRenderTargets.forEach((target) => {
        this.renderer.setRenderTarget(target);
        this.renderer.clear();
      });
    }
    super.clear();
  }

  gfPass(inputTexture) {
    this.gfUniforms.distanceTexture = inputTexture;
    this.gfUniforms.surfaceTexture = this.drawPassTexture ?? this.surface.texture;

    this.renderer.setRenderTarget(this.gfRenderTargets[0]);
    this.gfRender();
    return this.gfRenderTargets[0].texture;
  }

  renderPass() {
    let out = this.seedPass(this.drawPass());
    const jfaTexture = this.jfaPass(out);
    const distanceTexture = this.dfPass(jfaTexture);
    const gradientTexture = this.gfPass(distanceTexture);
    this.raymarchPass(this.drawPassTexture, gradientTexture, distanceTexture);
  }
}

export default GradientField;
