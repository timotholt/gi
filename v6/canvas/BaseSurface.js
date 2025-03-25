// @run
import { webGlContext, webGlInit } from '../webgl/context.js';
import { getFrame, instantMode } from '../utils/animation.js';
import { initializeCanvas } from '../ui/canvasControls.js';
import PaintableCanvas from './PaintableCanvas.js';

export default class BaseSurface {
    constructor({ id, width, height, radius = 5, dpr, canvasScale }) {
    this.context = webGlContext();
    const { w, canvas } = this.context;
    this.w = w;
    this.gl = w.gl;
    this.renderer = w;
    this.canvas = canvas;
    
    this.alpha = 1.0;
    this.dpr = dpr || 1;
    this.canvasScale = canvasScale;
    this.width = width;
    this.height = height;
    // Create PaintableCanvas instances
    this.createSurface(this.width, this.height, radius);
    this.id = id;
    this.initialized = false;
    this.initialize();
    }
    
    createSurface(width, height, radius) {
    this.surface = new PaintableCanvas({ width, height, radius });
    }
    
    initialize() {
    // Child class should fill this out
    }
    
    load() {
    // Child class should fill this out
    }
    
    clear() {
    // Child class should fill this out
    }
    
    renderPass() {
    // Child class should fill this out
    }
    
    reset() {
    this.clear();
    let last = undefined;
    return new Promise((resolve) => {
    this.setHex("#f9a875");
    getFrame(() => this.draw(last, 0, false, resolve));
    }).then(() => new Promise((resolve) => {
    last = undefined;
    getFrame(() => {
      this.setHex("#000000");
      getFrame(() => this.draw(last, 0, true, resolve));
    });
    }))
    .then(() => {
      this.renderPass();
      getFrame(() => this.setHex("#fff6d3"));
    });
    
    }
    
    draw(last, t, isShadow, resolve) {
    if (t >= 10.0) {
    resolve();
    return;
    }
    
    const angle = (t * 0.05) * Math.PI * 2;
    
    let {x, y} = isShadow
    ? {
      x: 90 + 16 * t,
      y: 300 + 0 * t,
    }
    : {
      x: 100 + 100 * Math.sin(angle + 1.0) * Math.cos(angle * 0.25),
      y: 50 + 100 * Math.sin(angle * 0.7)
    };
    
    if (this.canvasScale != null) {
    x /= this.canvasScale;
    y /= this.canvasScale;
    }
    
    last ??= {x, y};
    
    this.surface.drawSmoothLine(last, {x, y});
    last = {x, y};
    
    const step = instantMode ? 5.0 : (isShadow ? 0.7 : 0.3);
    getFrame(() => this.draw(last, t + step, isShadow, resolve));
    }
    
    buildCanvas() {
    return initializeCanvas({
    id: this.id,
    canvas: this.canvas,
    onSetColor: ({r, g, b, a}) => {
      const alpha = a == 0 ? a : this.alpha;
      this.surface.currentColor = {r, g, b, a: alpha};
      this.drawUniforms.color = [
        this.surface.currentColor.r / 255.0,
        this.surface.currentColor.g / 255.0,
        this.surface.currentColor.b / 255.0,
        alpha,
      ];
    },
    startDrawing: (e) => this.surface.startDrawing(e),
    onMouseMove: (e) => this.surface.onMouseMove(e),
    stopDrawing: (e, redraw) => this.surface.stopDrawing(e, redraw),
    clear: () => this.clear(),
    reset: () => this.reset(),
    ...this.canvasModifications()
    });
    }
    
    canvasModifications() {
    return {}
    }
    
    observe() {
    const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting === true) {
      this.load();
      observer.disconnect(this.container);
    }
    });
    
    observer.observe(this.container);
    }
    
    initWebGL2({ uniforms, fragmentShader, vertexShader, renderTargetOverrides, ...rest }) {
    return webGlInit(
    this.context,
    this.width,
    this.height,
    {
      uniforms,
      fragmentShader,
      vertexShader,
    },
    renderTargetOverrides ?? {}, {
    dpr: this.dpr, canvasScale: this.canvasScale || 1, ...rest,
    })
    }
}
