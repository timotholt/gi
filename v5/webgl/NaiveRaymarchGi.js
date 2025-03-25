import GradientField from './GradientField.js';
import naive_raymarch_shader from "../shaders/naive_raymarch_shader.js";
import { onBuildReload } from './ReloadShaders.js';

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

export default NaiveRaymarchGi;
