// @run
// Core imports for WebGL context, animation, canvas controls and drawing
import { webGlContext, webGlInit } from "../webgl/context.js";
import { getFrame, instantMode } from "../utils/animation.js";
import { initializeCanvas } from "../ui/canvasControls.js";
import PaintableCanvas from "./PaintableCanvas.js";

/**
 * Base class for WebGL surface rendering and canvas interactions
 * Handles core functionality like drawing, animation, and event handling
 */
export default class BaseSurface {
  /**
   * @param {Object} params Configuration object
   * @param {string} params.id Canvas element ID
   * @param {number} params.width Surface width in pixels
   * @param {number} params.height Surface height in pixels
   * @param {number} params.radius=5 Brush radius for drawing
   * @param {number} params.dpr Device pixel ratio
   * @param {number} params.canvasScale Scale factor for canvas rendering
   */
  constructor({ id, width, height, radius = 5, dpr, canvasScale }) {
    // Set up WebGL context and canvas
    this.context = webGlContext();
    const { w, canvas } = this.context;
    this.w = w;
    this.gl = w.gl;
    this.renderer = w;
    this.canvas = canvas;

    // Initialize rendering properties
    this.alpha = 1.0;
    this.dpr = dpr || 1;
    this.canvasScale = canvasScale;
    this.width = width;
    this.height = height;

    // Create PaintableCanvas instance for drawing operations
    this.createSurface(this.width, this.height, radius);
    this.id = id;
    this.initialized = false;
    this.initialize();
  }

  /**
   * Creates a new PaintableCanvas instance for drawing operations
   * @param {number} width Canvas width
   * @param {number} height Canvas height
   * @param {number} radius Brush radius
   */
  createSurface(width, height, radius) {
    this.surface = new PaintableCanvas({ width, height, radius });
  }

  /**
   * Abstract method for child class initialization
   */
  initialize() {
    // Child class should fill this out
  }

  /**
   * Abstract method for child class loading
   */
  load() {
    // Child class should fill this out
  }

  /**
   * Abstract method for clearing the surface
   */
  clear() {
    // Child class should fill this out
  }

  /**
   * Abstract method for rendering a frame
   */
  renderPass() {
    // Child class should fill this out
  }

  /**
   * Resets the surface and draws a demo animation with two walls:
   * 1. A wavy orange line using sine/cosine functions
   * 2. A straight black shadow line
   * @returns {Promise} Resolves when animation completes
   */
  reset() {
    this.clear();
    let last = undefined;
    return new Promise((resolve) => {
      this.setHex("#f9a875");  // Orange color for main wall
      getFrame(() => this.draw(last, 0, false, resolve));
    })
      .then(
        () =>
          new Promise((resolve) => {
            last = undefined;
            getFrame(() => {
              this.setHex("#000000");  // Black color for shadow wall
              getFrame(() => this.draw(last, 0, true, resolve));
            });
          })
      )
      .then(() => {
        this.renderPass();
        getFrame(() => this.setHex("#fff6d3"));  // Final light beige color
      });
  }

  /**
   * Draws a single frame of the demo animation
   * @param {Object} last Previous point coordinates
   * @param {number} t Time parameter (0-10)
   * @param {boolean} isShadow Whether drawing shadow line
   * @param {Function} resolve Promise resolve function
   */
  draw(last, t, isShadow, resolve) {
    if (t >= 10.0) {
      resolve();
      return;
    }

    const angle = t * 0.05 * Math.PI * 2;

    // Calculate current point based on whether drawing shadow or main line
    let { x, y } = isShadow
      ? {
          x: 90 + 16 * t,  // Straight line for shadow
          y: 300 + 0 * t,  // Fixed y position
        }
      : {
          x: 100 + 100 * Math.sin(angle + 1.0) * Math.cos(angle * 0.25),  // Wavy pattern
          y: 50 + 100 * Math.sin(angle * 0.7),  // Vertical oscillation
        };

    // Apply canvas scaling if needed
    if (this.canvasScale != null) {
      x /= this.canvasScale;
      y /= this.canvasScale;
    }

    last ??= { x, y };

    // Draw line segment and update last point
    this.surface.drawSmoothLine(last, { x, y });
    last = { x, y };

    // Calculate step size based on mode and line type
    const step = instantMode ? 5.0 : isShadow ? 0.7 : 0.3;
    getFrame(() => this.draw(last, t + step, isShadow, resolve));
  }

  /**
   * Sets up canvas controls and event handlers
   * @returns {Object} Canvas control configuration
   */
  buildCanvas() {
    return initializeCanvas({
      id: this.id,
      canvas: this.canvas,
      onSetColor: ({ r, g, b, a }) => {

        // Handle alpha blending
        const alpha = a == 0 ? a : this.alpha;
        this.surface.currentColor = { r, g, b, a: alpha };
        
        // Convert color to normalized WebGL format
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
      ...this.canvasModifications(),
    });
  }

  /**
   * Hook for child classes to modify canvas configuration
   * @returns {Object} Additional canvas modifications
   */
  canvasModifications() {
    return {};
  }

  /**
   * Sets up intersection observer for lazy loading
   * Loads content when surface becomes visible
   */
  observe() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting === true) {
        this.load();
        observer.disconnect(this.container);
      }
    });

    observer.observe(this.container);
  }

  /**
   * Initializes WebGL2 context with provided configuration
   * @param {Object} config WebGL configuration object
   * @param {Object} config.uniforms Shader uniforms
   * @param {string} config.fragmentShader Fragment shader code
   * @param {string} config.vertexShader Vertex shader code
   * @param {Object} config.renderTargetOverrides Render target settings
   * @returns {Object} Initialized WebGL context and properties
   */
  initWebGL2({
    uniforms,
    fragmentShader,
    vertexShader,
    renderTargetOverrides,
    ...rest
  }) {
    return webGlInit(
      this.context,
      this.width,
      this.height,
      {
        uniforms,
        fragmentShader,
        vertexShader,
      },
      renderTargetOverrides ?? {},
      {
        dpr: this.dpr,
        canvasScale: this.canvasScale || 1,
        ...rest,
      }
    );
  }
}
