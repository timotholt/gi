import { WebGL2MicroLayer } from './WebGL2MicroLayer.js';

export function webGlContext() {
    const canvas = document.createElement('canvas');
    const w = new WebGL2MicroLayer(canvas);
    const pipeline = w.createPipeline();
    return { w, canvas, pipeline} ;
}
    
export function webGlInit(
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
    