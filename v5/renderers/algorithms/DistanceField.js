// @run
class DistanceField extends JFA {
    innerInitialize() {
    super.innerInitialize();
    
    const {stage: dfStage, uniforms: dfUniforms, render: dfRender, renderTargets: dfRenderTargets} = this.initWebGL2({
    uniforms: {
      resolution: [this.width, this.height],
      jfaTexture: null,
    },
    renderTargetOverrides: {
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
      internalFormat: this.gl.R16F,
      format: this.gl.RED,
      type: this.gl.HALF_FLOAT,
    },
    fragmentShader: `
      uniform sampler2D jfaTexture;
      uniform vec2 resolution;
    
      in vec2 vUv;
      out float FragColor;
    
      void main() {
        ivec2 texel = ivec2(vUv.x * resolution.x, vUv.y * resolution.y);
        vec2 nearestSeed = texelFetch(jfaTexture, texel, 0).xy;
        float dist = clamp(distance(vUv, nearestSeed), 0.0, 1.0);
    
        // Normalize and visualize the distance
        FragColor = dist;
      }`,
    });
    
    this.dfStage = dfStage;
    this.dfUniforms = dfUniforms;
    this.dfRender = dfRender;
    this.dfRenderTargets = dfRenderTargets;
    this.prev = 0;
    this.hasRendered = false;
    }
    
    clear() {
    if (this.initialized) {
    this.dfRenderTargets.forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    }
    super.clear();
    }
    
    dfPass(inputTexture) {
    this.dfUniforms.jfaTexture = inputTexture;
    
    this.renderer.setRenderTarget(this.dfRenderTargets[0]);
    this.dfRender();
    return this.dfRenderTargets[0].texture;
    }
    
    renderPass() {
    let out = this.drawPass();
    out = this.seedPass(out);
    out = this.jfaPass(out);
    out = this.dfPass(out);
    this.renderer.setRenderTarget(null);
    this.dfRender();
    }
}
