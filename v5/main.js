// @run

import { WebGL2MicroLayer, Pass, Pipeline, RenderTarget } from './webgl/index.js';

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

function addSlider({
               id,
               name,
               onUpdate,
               options = {},
               hidden = false,
               showValue = true,
               initialSpanValue = undefined,
             }) {
const div = document.createElement("div");
div.style = `display: ${hidden ? "none": "flex"}; align-items: center; gap: 8px`;
document.querySelector(`#${id}`).appendChild(div);
div.append(`${name}`);
const input = document.createElement("input");
input.id = `${id}-${name.replace(" ", "-").toLowerCase()}-slider`;
input.className = "slider";
input.type = "range";
Object.entries(options).forEach(([key, value]) => {
input.setAttribute(key, value);
});
if (options.value) {
input.value = options.value;
}
const span = document.createElement("span");
input.setSpan = (value) => span.innerText = `${value}`;

input.addEventListener("input", () => {
input.setSpan(`${onUpdate(input.value)}`);
});
span.innerText = `${input.value}`;
div.appendChild(input);
div.appendChild(span);

input.onUpdate = onUpdate;
if (initialSpanValue != null) {
input.setSpan(initialSpanValue);
}
return input;
}


    //=========

// Draw shader
import draw_shader from "./shaders/draw_shader.js";
//======


//======

import volumetric_rc_fragment from "./shaders/volumetric_rc_fragment_shader.js";

    //=========


    //==============



    //==============

import naive_raymarch_shader from "./shaders/naive_raymarch_shader.js";

//=============


//==============

import rc_fragment from "./shaders/rc_shader.js";

//===========


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

