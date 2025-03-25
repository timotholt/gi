// @run

import { WebGL2MicroLayer, Pass, Pipeline, RenderTarget } from './webgl/index.js';
import { GPUTimer} from './utils/gputimer.js';
import { initializeCanvas, hexToRgb, rgbToHex } from './ui/canvasControls.js';
import { addSlider } from './ui/slider.js';
import { onBuildReload } from './webgl/ReloadShaders.js';
import { isMobile } from './utils/device.js';
import { webGlContext, webGlInit } from './webgl/context.js';
import { instantMode, getFrame } from './utils/animation.js';
import BaseSurface from './canvas/BaseSurface.js';
import Drawing from "./canvas/Drawing.js";
import VolumetricRC from './webgl/VolumetricRC.js';
import JFA from './webgl/JFA.js';
import DistanceField from './webgl/DistanceField.js';
import GradientField from './webgl/GradientField.js';
import NaiveRaymarchGi from './webgl/NaiveRaymarchGi.js';
import rc_fragment from "./shaders/rc_shader.js";

window.mdxishState = {
    startTime: new Date(),
    scrollY: 0,
  };
window.mdxref = (ref) => document.querySelector('[data-id="' + ref + '"]');



const vertexShader = `
in vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

//======



    //==============
  
//=============

// @run
class RC extends GradientField {
    innerInitialize() {
    this.lastRequest = Date.now();
    this.frame = 0;
    this.baseRayCount = 4.0;
    this.reduceDemandCheckbox = document.querySelector("#reduce-demand");
    this.forceFullPass = !this.reduceDemandCheckbox.checked;
    super.innerInitialize();
    this.gpuTimer = new GPUTimer(this.gl, false);
    this.activelyDrawing = false;
    this.rawBasePixelsBetweenProbesExponent = 0.0;
    this.rawBasePixelsBetweenProbes = Math.pow(2, this.rawBasePixelsBetweenProbesExponent);
    
    this.animating = false;
    
    this.enableSrgb = document.querySelector("#enable-srgb");
    this.enablePainterly = document.querySelector("#enable-painterly");
    this.addNoise = document.querySelector("#add-noise");
    this.bilinearFix = document.querySelector("#bilinear-fix");
    this.sunAngleSlider = document.querySelector("#rc-sun-angle-slider");
    this.sunAngleSlider.disabled = true;
    
    this.pixelsBetweenProbes = addSlider({
    id: "radius-slider-container",
    name: "Pixels Between Base Probes",
    onUpdate: (value) => {
      this.rawBasePixelsBetweenProbes = Math.pow(2, value);
      this.initializeParameters(true);
      this.renderPass();
      return Math.pow(2, value);
    },
    options: { min: 0, max: 4, value: this.rawBasePixelsBetweenProbesExponent, step: 1 },
    initialSpanValue: this.rawBasePixelsBetweenProbes,
    });
    
    this.rayIntervalSlider = addSlider({
    id: "radius-slider-container", name: "Interval Length", onUpdate: (value) => {
      this.rcUniforms.rayInterval = value;
      this.renderPass();
      return value;
    },
    options: {min: 1.0, max: 512.0, step: 0.1, value: 1.0},
    });
    
    this.baseRayCountSlider = addSlider({
    id: "radius-slider-container", name: "Base Ray Count", onUpdate: (value) => {
      this.rcUniforms.baseRayCount = Math.pow(4.0, value);
      this.baseRayCount = Math.pow(4.0, value);
      this.renderPass();
      return Math.pow(4.0, value);
    },
    options: {min: 1.0, max: 3.0, step: 1.0, value: 1.0},
    });
    
    this.intervalOverlapSlider = addSlider({
    id: "radius-slider-container", name: "Interval Overlap %", onUpdate: (value) => {
      this.rcUniforms.intervalOverlap = value;
      this.renderPass();
      return value;
    },
    options: {min: -1.0, max: 2.0, step: 0.01, value: 0.0},
    });
    
    this.initializeParameters();
    
    const fragmentShader = rc_fragment;
    
    const {stage: rcStage, uniforms: rcUniforms, render: rcRender, renderTargets: rcRenderTargets} = this.initWebGL2({
    renderTargetOverrides: {
      minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
      magFilter: this.gl.LINEAR,
      internalFormat: this.gl.R11F_G11F_B10F,
      format: this.gl.RGB,
      type: this.gl.HALF_FLOAT
    },
    uniforms: {
      resolution: [this.width, this.height],
      sceneTexture: null,
      distanceTexture: null,
      gradientTexture: null,
      lastTexture: null,
      cascadeExtent: [this.radianceWidth, this.radianceHeight],
      cascadeCount: this.radianceCascades,
      cascadeIndex: 0.0,
      basePixelsBetweenProbes: this.basePixelsBetweenProbes,
      cascadeInterval: this.radianceInterval,
      rayInterval: this.rayIntervalSlider.value,
      intervalOverlap: this.intervalOverlapSlider.value,
      baseRayCount: Math.pow(4.0, this.baseRayCountSlider.value),
      sunAngle: this.sunAngleSlider.value,
      time: 0.1,
      painterly: this.enablePainterly.checked,
      srgb: this.enableSrgb.checked ? 2.2 : 1.0,
      enableSun: false,
      addNoise: this.addNoise.checked,
      firstCascadeIndex: 0,
      bilinearFix: this.bilinearFix.checked,
    },
    fragmentShader,
    });
    
    this.baseRayCountSlider.setSpan(Math.pow(4.0, this.baseRayCountSlider.value));
    
    this.firstLayer = this.radianceCascades - 1;
    this.lastLayer = 0;
    
    this.lastLayerSlider = addSlider({
    id: "radius-slider-container",
    name: "(RC) Layer to Render",
    onUpdate: (value) => {
      this.rcUniforms.firstCascadeIndex = value;
      this.overlayUniforms.showSurface = value == 0;
      this.lastLayer = value;
      this.renderPass();
      return value;
    },
    options: { min: 0, max: this.radianceCascades - 1, value: 0, step: 1 },
    });
    
    this.firstLayerSlider = addSlider({
    id: "radius-slider-container",
    name: "(RC) Layer Count",
    onUpdate: (value) => {
      this.rcUniforms.cascadeCount = value;
      this.firstLayer = value - 1;
      this.renderPass();
      return value;
    },
    options: { min: 1, max: this.radianceCascades, value: this.radianceCascades, step: 1 },
    });
    
    this.stage = 3;
    this.stageToRender = addSlider({
    id: "radius-slider-container",
    name: "Stage To Render",
    onUpdate: (value) => {
      this.stage = value;
      this.renderPass();
      return value;
    },
    options: { min: 0, max: 3, value: 3, step: 1 },
    });
    
    const {stage: overlayStage, uniforms: overlayUniforms, render: overlayRender, renderTargets: overlayRenderTargets} = this.initWebGL2({
    renderTargetOverrides: {
      minFilter: this.gl.LINEAR,
      magFilter: this.gl.LINEAR,
    },
    scale: true,
    uniforms: {
      inputTexture: null,
      drawPassTexture: null,
      resolution: [this.width, this.height],
      showSurface: true ,
    },
    fragmentShader: `
      uniform sampler2D inputTexture;
      uniform sampler2D drawPassTexture;
      uniform vec2 resolution;
      uniform bool showSurface;
    
      in vec2 vUv;
      out vec4 FragColor;
    
      void main() {
        vec4 rc = texture(inputTexture, vUv);
        vec4 d = texture(drawPassTexture, vUv);
    
        FragColor = rc;
        // FragColor = vec4(d.a > 0.0 && showSurface ? d.rgb : rc.rgb, 1.0);
      }`
    });
    
    this.radiusSlider = addSlider({
    id: "radius-slider-container", name: "Brush Radius", onUpdate: (value) => {
      this.surface.RADIUS = value;
      this.drawUniforms.radiusSquared = Math.pow(this.surface.RADIUS, 2.0);
      this.renderPass();
      return this.surface.RADIUS;
    },
    options: {min: urlParams.get("rcScale") ?? 1.0, max: 100.0, step: 0.1, value: this.surface.RADIUS},
    });
    
    this.rcStage = rcStage;
    this.rcUniforms = rcUniforms;
    this.rcRender = rcRender;
    this.rcRenderTargets = rcRenderTargets;
    this.prev = 0;
    
    this.overlayStage = overlayStage;
    this.overlayUniforms = overlayUniforms;
    this.overlayRender = overlayRender;
    this.overlayRenderTargets = overlayRenderTargets;
    }
    
    // Key parameters we care about
    initializeParameters(setUniforms) {
    this.renderWidth = this.width;
    this.renderHeight = this.height;
    
    // Calculate radiance cascades
    const angularSize = Math.sqrt(
    this.renderWidth * this.renderWidth + this.renderHeight * this.renderHeight
    );
    this.radianceCascades = Math.ceil(
    Math.log(angularSize) / Math.log(4)
    ) + 1.0;
    this.basePixelsBetweenProbes = this.rawBasePixelsBetweenProbes;
    this.radianceInterval = 1.0;
    
    this.radianceWidth = Math.floor(this.renderWidth / this.basePixelsBetweenProbes);
    this.radianceHeight = Math.floor(this.renderHeight / this.basePixelsBetweenProbes);
    
    if (setUniforms) {
    this.rcUniforms.basePixelsBetweenProbes = this.basePixelsBetweenProbes;
    this.rcUniforms.cascadeCount = this.radianceCascades;
    this.rcUniforms.cascadeInterval = this.radianceInterval;
    this.rcUniforms.cascadeExtent = (
      [this.radianceWidth, this.radianceHeight]
    );
    
    }
    }
    
    overlayPass(inputTexture, preRc) {
    this.overlayUniforms.drawPassTexture = this.drawPassTextureHigh;
    
    if (this.forceFullPass) {
    this.frame = 0;
    }
    const frame = this.forceFullPass ? 0 : 1 - this.frame;
    
    if (this.frame == 0 && !this.forceFullPass) {
    const input = this.overlayRenderTargets[0].texture ?? this.drawPassTexture;
    this.overlayUniforms.inputTexture = input;
    this.renderer.setRenderTarget(this.overlayRenderTargets[1]);
    this.overlayRender();
    } else {
    this.overlayUniforms.inputTexture = inputTexture;
    this.renderer.setRenderTarget(this.overlayRenderTargets[0]);
    this.overlayRender();
    }
    
    if (!this.isDrawing && !isMobile) {
    this.overlay = true;
    this.surface.drawSmoothLine(this.surface.currentMousePosition, this.surface.currentMousePosition);
    this.renderer.setRenderTarget(null);
    this.overlayRender();
    this.overlay = false;
    } else if (isMobile) {
    this.renderer.setRenderTarget(null);
    this.overlayRender();
    }
    }
    
    triggerDraw() {
    if (this.overlay) {
    this.renderer.setRenderTarget(null);
    this.render();
    return;
    }
    super.triggerDraw();
    }
    
    canvasModifications() {
    return {
    startDrawing: (e) => {
      this.lastRequest = Date.now();
      this.surface.startDrawing(e);
    },
    onMouseMove: (e) => {
      const needRestart = Date.now() - this.lastRequest > 1000;
      this.lastRequest = Date.now();
      this.surface.onMouseMove(e);
      this.renderPass();
    },
    stopDrawing: (e, redraw) => {
      this.lastRequest = Date.now();
      this.surface.stopDrawing(e, redraw);
    },
    toggleSun: (e) => {
      if (e.currentTarget.getAttribute("selected") === "true") {
        e.currentTarget.removeAttribute("selected");
      } else {
        e.currentTarget.setAttribute("selected", "true");
      }
      const current = this.rcUniforms.enableSun;
      this.sunAngleSlider.disabled = current;
        this.rcUniforms.enableSun = !current;
        this.renderPass();
    }
    }
    }
    
    rcPass(gradientFieldTexture, distanceFieldTexture, drawPassTexture) {
    this.rcUniforms.distanceTexture = distanceFieldTexture;
    this.rcUniforms.gradientTexture = gradientFieldTexture;
    this.rcUniforms.sceneTexture = drawPassTexture;
    this.rcUniforms.cascadeIndex = 0;
    
    if (this.frame == 0) {
    this.rcUniforms.lastTexture = null;
    }
    
    const halfway = Math.floor((this.firstLayer - this.lastLayer) / 2);
    const last = this.frame == 0 && !this.forceFullPass ? halfway + 1 : this.lastLayer;
    this.rcPassCount = this.frame == 0 ? this.firstLayer : halfway;
    
    for (let i = this.firstLayer; i >= last; i--) {
    this.gpuTimer.start(`rcPass-${i}`);
    this.rcUniforms.cascadeIndex = i;
    
    this.renderer.setRenderTarget(this.rcRenderTargets[this.prev]);
    this.rcRender();
    this.rcUniforms.lastTexture = this.rcRenderTargets[this.prev].texture;
    this.prev = 1 - this.prev;
    this.gpuTimer.end(`rcPass-${i}`);
    }
    
    return this.rcRenderTargets[1 - this.prev].texture;
    }
    
    doRenderPass() {
    if (this.frame == 0) {
    if (this.stage == 0) {
      this.renderer.setRenderTarget(null);
      this.render();
      this.finishRenderPass();
      return;
    }
    
    this.gpuTimer.start('seedPass');
    let out = this.seedPass(this.drawPassTexture);
    this.gpuTimer.end('seedPass');
    
    this.gpuTimer.start('jfaPass');
    out = this.jfaPass(out);
    this.gpuTimer.end('jfaPass');
    
    if (this.stage == 1) {
      this.finishRenderPass();
      this.renderer.setRenderTarget(null);
      this.jfaRender();
      return;
    }
    
    this.gpuTimer.start('dfPass');
    this.distanceFieldTexture = this.dfPass(out);
    this.gpuTimer.end('dfPass');
    
    if (this.stage == 2) {
      this.finishRenderPass();
      this.renderer.setRenderTarget(null);
      this.dfRender();
      return;
    }
    
    this.gpuTimer.start('gfPass');
    this.gradientFieldTexture = this.gfPass(this.distanceFieldTexture);
    this.gpuTimer.end('gfPass');
    }
    
    let rcTexture = this.rcPass(this.gradientFieldTexture, this.distanceFieldTexture, this.drawPassTexture);
    
    this.overlayPass(rcTexture, false);
    
    this.finishRenderPass();
    }
    
    finishRenderPass() {
    // Update timer and potentially print results
    this.gpuTimer.update();
    
    if (!this.forceFullPass) {
    this.frame = 1 - this.frame;
    }
    }
    
    // foo bar baz!!
    renderPass() {
    this.drawPassTexture = this.drawPass();
    
    if (!this.animating) {
    this.animating = true;
    requestAnimationFrame(() => {
      this.animate();
    });
    }
    }
    
    animate() {
    this.animating = true;
    
    this.doRenderPass();
    this.desiredRenderPass = false;
    
    requestAnimationFrame(() => {
    if (Date.now() - this.lastRequest > 1000) {
      this.animating = false;
      return;
    }
    this.animate();
    });
    }
    
    clear() {
    this.lastFrame = null;
    if (this.initialized) {
    this.rcRenderTargets.forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    }
    super.clear();
    }
    
    //foo bar baz!!
    load() {
    this.reduceDemandCheckbox.addEventListener("input", () => {
    this.forceFullPass = !this.reduceDemandCheckbox.checked;
    this.renderPass();
    });
    this.bilinearFix.addEventListener("input", () => {
    this.rcUniforms.bilinearFixEnabled = this.bilinearFix.checked;
    this.renderPass();
    });
    this.enableSrgb.addEventListener("input", () => {
    this.rcUniforms.srgb = this.enableSrgb.checked ? 2.2 : 1.0;
    this.renderPass();
    });
    this.addNoise.addEventListener("input", () => {
    this.rcUniforms.addNoise = this.addNoise.checked;
    this.renderPass();
    });
    this.enablePainterly.addEventListener("input", () => {
    this.rcRenderTargets.forEach((r) => {
      if (this.enablePainterly.checked) {
        r.updateFilters({
          minFilter: this.gl.NEAREST_MIPMAP_NEAREST,
          magFilter: this.gl.NEAREST,
        });
      } else {
        r.updateFilters({
          minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
          magFilter: this.gl.LINEAR,
        });
      }
      this.rcUniforms.painterly = this.enablePainterly.checked;
      this.renderPass();
    });
    });
    this.sunAngleSlider.addEventListener("input", () => {
    this.rcUniforms.sunAngle = this.sunAngleSlider;
    this.renderPass();
    });
    window.mdxishState.onReload = onBuildReload(this, "radianceCascades");
    super.load();
    }
    }

//============

const urlParams = new URLSearchParams(window.location.search);
const widthString = urlParams.get('width');
const heightString = urlParams.get('height');
const dp = urlParams.get('pixelRatio') ?? 1.0;
const rcScale = urlParams.get('rcScale') ?? dp;
const classic = urlParams.get('classic');
const volumetric = urlParams.get('volumetric');
const naive = urlParams.get('naive');

const widthParam = widthString ? parseInt(widthString) : (isMobile ? 300 : 512);
const heightParam = heightString ? parseInt(heightString) : (isMobile ? 400 : 512);
let [width, height] = [widthParam, heightParam];

if (volumetric) {
window.radianceCascades = new VolumetricRC({
id: "rc-canvas",
width: dp * width / rcScale,
height: dp * height / rcScale,
radius: 4 * dp,
dpr: rcScale,
canvasScale: rcScale / dp
});
} else if (naive) {
window.radianceCascades = new NaiveRaymarchGi({
id: "rc-canvas",
width: dp * width / rcScale,
height: dp * height / rcScale,
radius: 4 * dp,
dpr: rcScale,
canvasScale: rcScale / dp
});
} else {
window.radianceCascades = new RC({
id: "rcv-canvas",
width: dp * width / rcScale,
height: dp * height / rcScale,
radius: 4 * dp,
dpr: rcScale,
canvasScale: rcScale / dp
});
}

//===========
