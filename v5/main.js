// @run

import { WebGL2MicroLayer, Pass, Pipeline, RenderTarget } from './webgl/index.js';
import { GPUTimer} from './utils/gputimer.js';

window.mdxishState = {
    startTime: new Date(),
    scrollY: 0,
  };
window.mdxref = (ref) => document.querySelector('[data-id="' + ref + '"]');


const instantMode = false;
const getFrame = requestAnimationFrame;
const asciiBase64 = `data:image/png;base64,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`;
// @run
function onBuildReload(self, instance) {
return (event) => {
const oldShaderSet = new Set(
Object.keys(window[instance])
.filter((a) => a.toLowerCase().includes("stage"))
.map((p) => window[instance][p]?.fragmentShader)
);
document.querySelectorAll("iframe").forEach((o) => {
o.parentNode.removeChild(o);
});
const iframe = document.createElement('iframe');
iframe.style.display = "none";
document.body.appendChild(iframe);
const htmlContent = event.html;
iframe.srcdoc = htmlContent;

iframe.onload = () => {
const win = iframe.contentWindow[instance];
const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
const shaders = Object.keys(win)
  .filter((a) => a.toLowerCase().includes("stage"))
  .map((p) => win?.[p]?.fragmentShader);

if (oldShaderSet.size === shaders.length) {
  const same = shaders.filter((shader) => oldShaderSet.has(shader));
  if (same.length === shaders.length) {
    window.location.reload();
    return;
  }
}

Object.keys(win)
  .filter((a) => a.toLowerCase().includes("stage"))
  .forEach((p) => {
    const shader = win?.[p]?.fragmentShader;
    if (shader) {
      self[p].updateFragmentShader(shader);
    }
});

self.renderPass();
document.querySelectorAll("iframe").forEach((o) => {
  o.parentNode.removeChild(o);
});
};
return false;
};
}

import { addSlider } from './ui/slider.js';


const isMobile = (() => {
return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
|| (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
})();

if (isMobile) {
const inp = document.createElement("input");
const inpCon = document.querySelector("#mobile-input");
inpCon.appendChild(inp);
}

const vertexShader = `
in vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const resetSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>`;

const eraseSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" /><path d="M18 13.3l-6.3 -6.3" /></svg>`;

const clearSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>`;

const sunMoonSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9.173 14.83a4 4 0 1 1 5.657 -5.657" /><path d="M11.294 12.707l.174 .247a7.5 7.5 0 0 0 8.845 2.492a9 9 0 0 1 -14.671 2.914" /><path d="M3 12h1" /><path d="M12 3v1" /><path d="M5.6 5.6l.7 .7" /><path d="M3 21l18 -18" /></svg>`

function hexToRgb(hex) {
const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
return result ? {
r: parseInt(result[1], 16),
g: parseInt(result[2], 16),
b: parseInt(result[3], 16),
a: result[4] ? parseInt(result[4], 16) : 255,
} : null;
}

function rgbToHex(r, g, b, a) {
if (a !== undefined) {
return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1) +
Math.round(a * 255).toString(16).padStart(2, '0');
}
return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// This is the html plumbing / structure / controls for little canvases
function intializeCanvas({
                     id, canvas, onSetColor, startDrawing, onMouseMove, stopDrawing, clear, reset, toggleSun, colors = [
"#fff6d3", "#f9a875", "#eb6b6f", "#7c3f58", "#03C4A1", "#3d9efc", "#000000", "#00000000"
]
                   }) {
const clearDom = clear ? `<button id="${id}-clear" class="iconButton">${clearSvg}</button>` : "";
const resetDom = reset ? `<button id="${id}-reset" class="iconButton">${resetSvg}</button>` : "";
const sunMoonDom = toggleSun ? `<button id="${id}-sun" class="iconButton">${sunMoonSvg}</button>` : "";
const thisId = document.querySelector(`#${id}`);
thisId.innerHTML = `
<div style="display: flex; gap: 20px;">
<div id="${id}-canvas-container"></div>

<div style="display: flex; flex-direction: column; justify-content: space-between;">
  <div id="${id}-color-picker" style="display: flex; flex-direction: column;  border: solid 1px white; margin: 1px;">
    <input type="color" id="${id}-color-input" value="#ffffff" style="width: 20px; height: 20px; padding: 0; border: none;" >
</div>
<div style="display: flex; flex-direction: column; gap: 2px">
${sunMoonDom}
${clearDom}
${resetDom}
</div>
</div>
</div>`;
const colorInput = document.getElementById(`${id}-color-input`);

function setColor(r, g, b, a) {
colorInput.value = rgbToHex(r, g, b);
onSetColor({r, g, b, a});
}

function setHex(hex) {
const rgb = hexToRgb(hex);
setColor(rgb.r, rgb.g, rgb.b, rgb.a);
const stringifiedColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
thisId.querySelectorAll(".arrow").forEach((node) => {
if (rgb.a === 0) {
  if (node.parentNode.style.backgroundColor === "var(--pre-background)") {
    node.className = "arrow";
  } else {
    node.className = "arrow hidden";
  }
} else if (node.parentNode.style.backgroundColor === stringifiedColor) {
  node.className = "arrow";
} else {
  node.className = "arrow hidden";
}
});
}

function updateColor(event) {
const hex = event.target.value;
setHex(hex);
}

colorInput.addEventListener('input', updateColor);

const colorPicker = document.querySelector(`#${id}-color-picker`);

colors.forEach((color, i) => {
const colorButton = document.createElement("button");
colorButton.className = "color";
colorButton.style.backgroundColor = color;
colorButton.innerHTML = `<span class="arrow hidden">&#9654;</span>`;
if (color === "#00000000") {
colorButton.innerHTML += `<span class="erase">${eraseSvg}</span>`;
colorButton.style.backgroundColor = "var(--pre-background)";
}
colorPicker.appendChild(colorButton);
colorButton.addEventListener('click', () => setHex(color));
});
const container = document.querySelector(`#${id}-canvas-container`);
container.appendChild(canvas);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseenter', (e) => {
if (e.buttons === 1) {
startDrawing(e);
}
});
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('touchmove', onMouseMove);
canvas.addEventListener('mouseup', (e) => stopDrawing(e, false));
canvas.addEventListener('touchend', (e) => stopDrawing(e, false));
canvas.addEventListener('touchcancel', (e) => stopDrawing(e, true));
canvas.addEventListener('mouseleave', (e) => stopDrawing(e, true));

if (clear) {
document.querySelector(`#${id}-clear`).addEventListener("click", () => {
clear();
});
}

if (reset) {
document.querySelector(`#${id}-reset`).addEventListener("click", () => {
reset();
});
}

if (toggleSun) {
document.querySelector(`#${id}-sun`).addEventListener("click", (e) => {
toggleSun(e);
});
}

return {container, setHex, canvas, onSetColor};
}

// @run

class PaintableCanvas {
constructor({width, height, initialColor = 'transparent', radius = 6, friction = 0.2}) {

this.isDrawing = false;
this.currentMousePosition = { x: 0, y: 0 };
this.lastPoint = { x: 0, y: 0 };
this.currentPoint = { x: 0, y: 0 };

this.mouseMoved = false;
this.currentColor = {r: 255, g: 255, b: 255, a: 255};
this.RADIUS = radius;
this.FRICTION = friction;
this.width = width;
this.height = height;

this.initialColor = initialColor;

this.onUpdateTextures = () => {
};

this.drawSmoothLine = (from, to) => {
throw new Error("Missing implementation");
}
}

updateTexture() {
this.texture.needsUpdate = true;
this.onUpdateTextures();
}

startDrawing(e) {
this.isDrawing = true;
this.currentMousePosition = this.lastPoint = this.currentPoint = this.getMousePos(e);
try {
this.onMouseMove(e);
} catch(e) {
console.error(e);
}
this.mouseMoved = false;
}

stopDrawing(e, redraw) {
const wasDrawing = this.isDrawing;
if (!wasDrawing) {
return false;
}
if (!this.mouseMoved) {
this.drawSmoothLine(this.currentPoint, this.currentPoint);
} else if (redraw) {
this.drawSmoothLine(this.currentPoint, this.getMousePos(e));
}
this.isDrawing = false;
this.mouseMoved = false;
return true;
}

onMouseMove(event) {
if (!this.isDrawing) {
this.currentMousePosition = this.lastPoint = this.currentPoint = this.getMousePos(event);
return false;
} else {
this.currentMousePosition = this.getMousePos(event);
}

this.mouseMoved = true;

this.doDraw();

return true;
}

doDraw() {
const newPoint = this.currentMousePosition;

// Some smoothing...
let dist = this.distance(this.currentPoint, newPoint);

if (dist > 0) {
let dir = {
  x: (newPoint.x - this.currentPoint.x) / dist,
  y: (newPoint.y - this.currentPoint.y) / dist
};
let len = Math.max(dist - Math.sqrt(this.RADIUS), 0);
let ease = 1 - Math.pow(this.FRICTION, 1 / 60 * 10);
this.currentPoint = {
  x: this.currentPoint.x + dir.x * len * ease,
  y: this.currentPoint.y + dir.y * len * ease
};
} else {
this.currentPoint = newPoint;
}

this.drawSmoothLine(this.lastPoint, this.currentPoint);
this.lastPoint = this.currentPoint;
}

// I'll be honest - not sure why I can't just use `clientX` and `clientY`
// Must have made a weird mistake somewhere.
getMousePos(e) {
e.preventDefault();

const {width, height} = e.target.style;
const [dx, dy] = [
(width ? this.width / parseInt(width) : 1.0),
(height ? this.height / parseInt(height) : 1.0),
];

if (e.touches) {
return {
  x: (e.touches[0].clientX - (e.touches[0].target.offsetLeft - window.scrollX)) * dx,
  y: (e.touches[0].clientY - (e.touches[0].target.offsetTop - window.scrollY)) * dy
};
}

return {
x: (e.clientX - (e.target.offsetLeft - window.scrollX)) * dx,
y: (e.clientY - (e.target.offsetTop - window.scrollY)) * dy
};
}

distance(p1, p2) {
return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

setColor(r, g, b, a) {
this.currentColor = {r, g, b, a};
}

clear() {
this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
this.currentImageData = new ImageData(this.canvas.width, this.canvas.height);
this.updateTexture();
}
}





function webGlContext() {
const canvas = document.createElement('canvas');
const w = new WebGL2MicroLayer(canvas);
const pipeline = w.createPipeline();
return { w, canvas, pipeline} ;
}

function webGlInit(
context,
width,
height,
materialProperties,
renderTargetOverrides = {},
extra = {}
) {
const { w, pipeline, canvas } = context;
const dpr = extra.dpr || window.devicePixelRatio || 1;
const scaling = dpr;
const scale = extra.scale ? scaling : 1.0;
const canvasScale = extra.canvasScale ?? 1.0;

canvas.width = width * scaling;
canvas.height = height * scaling;
canvas.style.width = `${width * canvasScale}px`;
canvas.style.height = `${height * canvasScale}px`;

const renderTargetProps = {
minFilter: w.gl.NEAREST,
magFilter: w.gl.NEAREST,
internalFormat: w.gl.RGBA16F,
format: w.gl.RGBA,
type: w.gl.HALF_FLOAT,
...renderTargetOverrides
};

const renderTargetCount = extra?.renderTargetCount ?? 2;
const renderTargets = [];

for (let i = 0; i < renderTargetCount; i++) {
renderTargets.push(
w.createRenderTarget(width * scale, height * scale, renderTargetProps)
);
}

const pass = pipeline.createPass(materialProperties, renderTargetProps.generateMipmaps);

return {
canvas,
render: (uniforms = {}) => {
pass.render(uniforms);
},
renderTargets,
renderer: w,
scaling,
uniforms: pass.uniforms,
gl: pipeline.w.gl,
stage: pass,
};
}

// @run
class BaseSurface {
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
    return intializeCanvas({
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

    //=========

// Draw shader
import draw_shader from "./shaders/draw_shader.js";
//======

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


//======

import volumetric_rc_fragment from "./shaders/volumetric_rc_fragment_shader.js";

class VolumetricRC extends Drawing {
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
    this.bilinearFix = document.querySelector("#bilinear-fix");
    this.disableMips = document.querySelector("#disable-mips");
    this.nonLinearAccumulation = document.querySelector("#nonlinear-accumulation");
    this.addNoise = document.querySelector("#add-noise");
    this.ringingFix = document.querySelector("#ringing-fix");
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
    options: {min: 1.0, max: 6.0, step: 1.0, value: 1.0},
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
    
    //const fragmentShader = document.querySelector("#volumetric-rc-fragment").innerHTML;
    const fragmentShader = volumetric_rc_fragment;
    
    const {stage: rcStage, uniforms: rcUniforms, render: rcRender, renderTargets: rcRenderTargets} = this.initWebGL2({
    uniforms: {
      resolution: [this.width, this.height],
      sceneTexture: this.surface.texture,
      lastTexture: this.surface.texture,
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
      srgb: this.enableSrgb.checked ? 2.2 : 1.0,
      enableSun: false,
      painterly: this.enablePainterly.checked,
      bilinearFixEnabled: this.bilinearFix.checked,
      disableMips: this.disableMips.checked,
      nonLinearAccumulation: this.nonLinearAccumulation.checked,
      addNoise: this.addNoise.checked,
      firstCascadeIndex: 0,
      dpr: this.dpr,
    },
    renderTargetOverrides: {
      minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
      magFilter: this.gl.LINEAR,
       //internalFormat: this.gl.RGBA,
       //format: this.gl.RGBA,
      //type: this.gl.UNSIGNED_BYTE
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
      this.rcUniforms.cascadeCount= value;
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
    scale: true,
    uniforms: {
      inputTexture: this.surface.texture,
      drawPassTexture: this.surface.texture,
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
        // FragColor = vec4((d.a > 0.0 && showSurface) ? d : rc);
      }`
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
    
    overlayPass(inputTexture) {
    this.overlayUniforms.drawPassTexture = this.drawPassTextureHigh;
    
    if (this.forceFullPass) {
    this.frame = 0;
    }
    
    const input = this.drawPassTexture;
    this.overlayUniforms.inputTexture = inputTexture;
    this.renderer.setRenderTarget(this.overlayRenderTargets[this.frame]);
    this.overlayRender();
    
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
    
    rcPass(drawPassTexture) {
    this.rcUniforms.sceneTexture = drawPassTexture;
    
    if (this.frame == 0) {
    this.rcUniforms.lastTexture = drawPassTexture;
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
    }
    
    let rcTexture = this.rcPass(this.drawPassTexture);
    
    this.overlayPass(rcTexture);
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
    this.renderPass();
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
    this.disableMips.addEventListener("input", () => {
    this.rcUniforms.disableMips = this.disableMips.checked;
    this.renderPass();
    });
    this.nonLinearAccumulation.addEventListener("input", () => {
    this.rcUniforms.nonLinearAccumulation = this.nonLinearAccumulation.checked;
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
    this.rcUniforms.sunAngle = this.sunAngleSlider.value;
    this.renderPass();
    })
    window.mdxishState.onReload = onBuildReload(this, "radianceCascades");
    super.load();
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
    }

    //=========

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

    //==============

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

// @run
class GradientField extends DistanceField {
    innerInitialize() {
    super.innerInitialize();
    
    const {stage: gfStage, uniforms: gfUniforms, render: gfRender, renderTargets: gfRenderTargets} = this.initWebGL2({
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
    this.gfUniforms.surfaceTexture = this.drawPassTexture
    ?? this.surface.texture;
    
    this.renderer.setRenderTarget(this.gfRenderTargets[0]);
    this.gfRender();
    return this.gfRenderTargets[0].texture;
    }
    
    renderPass() {
    let out = this.drawPass();
    out = this.seedPass(out);
    out = this.jfaPass(out);
    out = this.dfPass(out);
    out = this.gfPass(out);
    this.renderer.setRenderTarget(null);
    this.dfRender();
    }
    }

    //==============

import naive_raymarch_shader from "./shaders/naive_raymarch_shader.js";

//=============

// @run
class NaiveRaymarchGi extends GradientField {
    innerInitialize() {
    super.innerInitialize();
    
    this.enableSrgb = document.querySelector("#enable-srgb");
    this.showNoise = document.querySelector("#add-noise");
    this.showNoise.checked = true;
    
    const {stage: giStage, uniforms: giUniforms, render: giRender, renderTargets: giRenderTargets} = this.initWebGL2({
    uniforms: {
      sceneTexture: null,
      distanceTexture: null,
      gradientTexture: null,
      rayCount: 128,
      maxSteps: 80,
      showNoise: this.showNoise.checked,
      accumRadiance: true,
      srgb: this.enableSrgb.checked ? 2.2 : 1.0,
      resolution: [this.width, this.height],
    },
    renderTargetOverrides: {
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
    },
    //fragmentShader: document.querySelector("#naive-raymarch-shader").innerHTML,
    fragmentShader: naive_raymarch_shader,

    });
    
    this.showNoise.addEventListener("input", () => {
    this.giUniforms.showNoise = this.showNoise.checked;
    this.renderPass();
    });
    
    this.giStage = giStage;
    this.giUniforms = giUniforms;
    this.giRender = giRender;
    this.giRenderTargets = giRenderTargets;
    
    this.enableSrgb.addEventListener("input", () => {
    this.giUniforms.srgb = this.enableSrgb.checked ? 2.2 : 1.0;
    this.renderPass();
    });
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
      const current = this.giUniforms.enableSun;
      this.sunAngleSlider.disabled = current;
      this.giUniforms.enableSun = !current;
      this.renderPass();
    }
    }
    }
    
    raymarchPass(inputTexture, gradientTexture, distanceFieldTexture) {
    this.giUniforms.sceneTexture = inputTexture;
    this.giUniforms.distanceTexture = distanceFieldTexture;
    this.giUniforms.gradientTexture = gradientTexture;
    this.renderer.setRenderTarget(null);
    this.giRender();
    }
    
    clear() {
    if (this.initialized) {
    this.giRenderTargets.forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    }
    super.clear();
    }
    
    doRenderPass() {
    let out = this.seedPass(this.drawPassTexture);
    const jfaTexture = this.jfaPass(out);
    const distanceTexture = this.dfPass(jfaTexture);
    const gradientTexture = this.gfPass(distanceTexture);
    this.raymarchPass(this.drawPassTexture, gradientTexture, distanceTexture);
    }
    
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
    
    load() {
    super.load();
    window.mdxishState.onReload = onBuildReload(this, "radianceCascades");
    }
    }

//==============

import rc_fragment from "./shaders/rc_shader.js";

//===========

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
    
    //const fragmentShader = document.querySelector("#rc-fragment").innerHTML;
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

