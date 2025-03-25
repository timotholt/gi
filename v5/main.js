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
import RC from './webgl/RC.js';

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


//============

const urlParams = new URLSearchParams(window.location.search);
export { urlParams };

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
