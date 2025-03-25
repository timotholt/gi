import { BaseSurface } from './BaseSurface.js';

// @run
class Drawing extends BaseSurface {
    initializeSmoothSurface() {
    const props = this.initWebGL2({
    uniforms: {
      asciiTexture: null,
      inputTexture: null,
      color: [1, 1, 1, 1],
      from: [0, 0],
      to: [0, 0],
      scale: 1.0,
      time: 0.0,
      dpr: this.dpr,
      resolution: [this.width, this.height],
      drawing: false,
      indicator: false,
      character: 35.0,
    },
    renderTargetOverrides: {
      minFilter: this.gl.NEAREST_MIPMAP_NEAREST,
      magFilter: this.gl.NEAREST,
       internalFormat: this.gl.RGBA,
       format: this.gl.RGBA,
      type: this.gl.UNSIGNED_BYTE
    },
    //fragmentShader: document.querySelector("#draw-shader").innerHTML,
    fragmentShader: draw_shader,
    
    extra: { renderTargetCount: 2 }
    });
    
    this.alphaSlider = addSlider({
    id: "alpha-slider-container",
    name: "Brush Alpha",
    onUpdate: (value) => {
      this.alpha = value;
      this.onSetColor(this.surface.currentColor);
      this.renderPass();
      return value;
    },
    options: { min: 0.0, max: 1.0, value: 1.0, step: 0.01 },
    });
    
    this.gl = props.gl;
    this.drawStage = props.stage;
    this.drawUniforms = props.uniforms;
    this.drawUniforms.asciiTexture = this.renderer.font;
    
    document.addEventListener("keydown", (e) => {
    this.drawUniforms.character = e.key.charCodeAt(0);
    this.renderPass();
    });
    
    this.surface.drawSmoothLine = (from, to) => {
    this.drawUniforms.drawing = true;
    this.drawUniforms.from = [from.x, this.height - from.y];
    this.drawUniforms.to = [to.x, this.height - to.y];
    this.triggerDraw();
    this.didJustDraw = !this.overlay;
    this.drawUniforms.drawing = false;
    }
    
    return props;
    }
    
    triggerDraw() {
    this.renderPass();
    }
    
    clear() {
    if (this.initialized) {
    this.renderTargets.forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    this.renderTargetsHigh.forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    }
    this.renderer.setRenderTarget(null);
    this.renderPass();
    }
    
    initialize() {
    const {
    canvas, render, renderTargets, scaling
    } = this.initializeSmoothSurface();
    this.upscaleSurface = true;
    this.canvas = canvas;
    this.render = render;
    this.renderTargets = renderTargets;
    const { container, setHex, onSetColor } = this.buildCanvas();
    this.container = container;
    this.onSetColor = onSetColor;
    this.setHex = setHex;
    this.renderIndex = 0;
    
    this.innerInitialize();
    
    this.scaling = scaling;
    this.indicatorRenderTarget = this.renderer.createRenderTarget(this.width * scaling, this.height * scaling, {
      minFilter: this.gl.NEAREST_MIPMAP_NEAREST,
      magFilter: this.gl.NEAREST,
      internalFormat: this.gl.RGBA,
      format: this.gl.RGBA,
      type: this.gl.UNSIGNED_BYTE
    });
    this.drawRenderTargetHighA = this.renderer.createRenderTarget(this.width * scaling, this.height * scaling, {
    minFilter: this.gl.NEAREST_MIPMAP_NEAREST,
    magFilter: this.gl.NEAREST,
    internalFormat: this.gl.RGBA,
    format: this.gl.RGBA,
    type: this.gl.UNSIGNED_BYTE
    });
    this.drawRenderTargetHighB = this.renderer.createRenderTarget(this.width * scaling, this.height * scaling, {
    minFilter: this.gl.NEAREST_MIPMAP_NEAREST,
    magFilter: this.gl.NEAREST,
    internalFormat: this.gl.RGBA,
    format: this.gl.RGBA,
    type: this.gl.UNSIGNED_BYTE
    });
    this.renderTargetsHigh = [this.drawRenderTargetHighA, this.drawRenderTargetHighB];
    this.renderIndexHigh = 0;
    
    this.observe();
    }
    
    innerInitialize() {
    
    }
    
    load() {
    this.renderer.font = this.renderer.createTextureFromImage(asciiBase64, () => {
    this.reset();
    });
    this.initialized = true;
    }
    
    drawPass() {
    this.drawUniforms.asciiTexture = this.renderer.font;
    this.drawUniforms.inputTexture = this.renderTargets[this.renderIndex].texture;
    this.drawUniforms.time = (this.drawUniforms.time + 1) % 10000;
    
    this.renderIndex = 1 - this.renderIndex;
    this.renderer.setRenderTarget(this.renderTargets[this.renderIndex]);
    this.render();
    
    let toReturn = this.renderTargets[this.renderIndex].texture;
    
    if (!this.isDrawing) {
    this.drawUniforms.drawing = true;
    this.drawUniforms.indicator = true;
    this.drawUniforms.from = [
      this.surface.currentMousePosition.x, this.height - this.surface.currentMousePosition.y
    ];
    this.drawUniforms.to = [
      this.surface.currentMousePosition.x, this.height - this.surface.currentMousePosition.y
    ];
    this.renderer.setRenderTarget(this.indicatorRenderTarget);
    this.render();
    toReturn = this.indicatorRenderTarget.texture;
    this.drawUniforms.indicator = false;
    this.drawUniforms.drawing = false;
    }
    
    if (this.upscaleSurface) {
    this.drawUniforms.inputTexture = this.renderTargetsHigh[this.renderIndexHigh].texture;
    this.renderIndexHigh = 1 - this.renderIndexHigh;
    this.drawUniforms.scale = this.scaling;
    this.renderer.setRenderTarget(this.renderTargetsHigh[this.renderIndexHigh]);
    this.render();
    this.drawUniforms.scale = 1.0;
    this.drawPassTextureHigh = this.renderTargetsHigh[this.renderIndexHigh].texture;
    } else {
    this.drawPassTextureHigh = this.renderTargets[this.renderIndex].texture;
    }
    
    return toReturn;
    }
    
    renderPass() {
    this.drawPass();
    this.renderer.setRenderTarget(null);
    this.render();
    }
}

export { Drawing };
