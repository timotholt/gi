
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
    