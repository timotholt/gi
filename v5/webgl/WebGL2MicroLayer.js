import { Pass } from './Pass.js';
import { Pipeline } from './Pipeline.js';
import { RenderTarget } from './RenderTarget.js';

export class WebGL2MicroLayer {
    constructor(canvas) {
    this.gl = canvas.getContext('webgl2', { antialiasing: false, alpha: false });
    if (!this.gl) {
    throw new Error('WebGL2 not supported');
    }
    const extF = this.gl.getExtension("EXT_color_buffer_float");
    const extHF = this.gl.getExtension("EXT_color_buffer_half_float");
    const extFL = this.gl.getExtension("OES_texture_float_linear");
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.disable(this.gl.SCISSOR_TEST);
    this.gl.clearDepth(1.0);
    this.gl.colorMask(true, true, true, true);
    
    this.programs = new Map();
    this.framebuffers = new Map();
    
    this.defaultRenderTargetProps = {
    minFilter: this.gl.NEAREST,
    magFilter: this.gl.NEAREST,
    internalFormat: this.gl.RGBA16F,
    format: this.gl.RGBA,
    type: this.gl.HALF_FLOAT
    }
    this.renderTargets = {};
    }
    
    createProgram(vertexShaderSource, fragmentShaderSource) {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(program));
    }
    
    return program;
    }
    
    addLineNumbers(source) {
    return source.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
    }
    
    createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    throw new Error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader) + `\n${this.addLineNumbers(source)}`);
    }
    
    return shader;
    }
    
    createTextureFromImage(path, cb) {
    // Load the texture
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Fill the texture with a 1x1 blue pixel as a placeholder
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    
    // Asynchronously load an image
    const image = new Image();
    image.src = path;
    image.onload = function() {
    // Create a temporary canvas to flip the image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Flip the image horizontally and vertically
    tempCtx.scale(1, -1);
    tempCtx.drawImage(image, 0, -image.height);
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null)
    
    if (cb) {
      cb();
    }
    };
    
    return texture;
    }
    
    createRenderTarget(width, height, overrides = {}, name = undefined) {
    const {
    generateMipmaps,
    minFilter,
    magFilter,
    internalFormat,
    format,
    type
    } = {
    ...(this.defaultRenderTargetProps),
    ...overrides
    };
    const gl = this.gl;
    
    const renderTargetName = name ?? `rt-${Object.keys(this.renderTargets).length}`;
    
    const framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
    
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
    //this.clear();
    
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Framebuffer is not complete: ' + status);
    }
    
    // Unbind the frame buffer and texture.
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    
    this.framebuffers.set(renderTargetName, {framebuffer, texture, width, height});
    this.renderTargets[renderTargetName] = new RenderTarget(
    this.gl, renderTargetName, texture, framebuffer
    );
    return this.renderTargets[renderTargetName];
    }
    
    setRenderTargetInternal(name, autoClear = true) {
    if (name === null) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    } else {
    const target = this.framebuffers.get(name);
    if (!target) {
      throw new Error(`Render target "${name}" not found`);
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target.framebuffer);
    this.gl.viewport(0, 0, target.width, target.height);
    }
    }
    
    setRenderTarget(renderTarget, autoClear = true) {
    return this.setRenderTargetInternal(renderTarget?.name ?? null, autoClear);
    }
    
    clear() {
    // this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);
    }
    
    getRenderTargetTexture(name) {
    const target = this.framebuffers.get(name);
    if (!target) {
    throw new Error(`Render target "${name}" not found`);
    }
    return target.texture;
    }
    
    setUniform(gl, textureUnits, numUniforms, uniforms, program, name, value) {
    const location = gl.getUniformLocation(program, name);
    if (location === null) {
    // console.warn(`Uniform "${name}" not found in the shader program.`);
    return;
    }
    
    // Get uniform info
    let uniformInfo = null;
    for (let i = 0; i < numUniforms; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info.name === name) {
      uniformInfo = info;
      break;
    }
    }
    
    if (!uniformInfo) {
    console.warn(`Unable to find uniform info for "${name}"`);
    return;
    }
    
    const { type, size } = uniformInfo;
    
    // Helper function to ensure array is of the correct type
    function ensureTypedArray(arr, Type) {
    return arr instanceof Type ? arr : new Type(arr);
    }
    
    switch (type) {
    // Scalars
    case gl.FLOAT:
      gl.uniform1f(location, value);
      break;
    case gl.INT:
    case gl.BOOL:
      gl.uniform1i(location, value);
      break;
    
    // Vectors
    case gl.FLOAT_VEC2:
      gl.uniform2fv(location, ensureTypedArray(value, Float32Array));
      break;
    case gl.FLOAT_VEC3:
      gl.uniform3fv(location, ensureTypedArray(value, Float32Array));
      break;
    case gl.FLOAT_VEC4:
      gl.uniform4fv(location, ensureTypedArray(value, Float32Array));
      break;
    case gl.INT_VEC2:
    case gl.BOOL_VEC2:
      gl.uniform2iv(location, ensureTypedArray(value, Int32Array));
      break;
    case gl.INT_VEC3:
    case gl.BOOL_VEC3:
      gl.uniform3iv(location, ensureTypedArray(value, Int32Array));
      break;
    case gl.INT_VEC4:
    case gl.BOOL_VEC4:
      gl.uniform4iv(location, ensureTypedArray(value, Int32Array));
      break;
    
    // Matrices
    case gl.FLOAT_MAT2:
      gl.uniformMatrix2fv(location, false, ensureTypedArray(value, Float32Array));
      break;
    case gl.FLOAT_MAT3:
      gl.uniformMatrix3fv(location, false, ensureTypedArray(value, Float32Array));
      break;
    case gl.FLOAT_MAT4:
      gl.uniformMatrix4fv(location, false, ensureTypedArray(value, Float32Array));
      break;
    
    // Sampler types
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      const textureUnit = textureUnits.length;
      this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
      textureUnits.push(textureUnit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, value);
      this.gl.uniform1i(location, textureUnit);
    
    
      // Can we disable this if not using mipmaps?
      // if (generateMipmaps) {
      if (value != null) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      }
      // }
      break;
    
    // Arrays
    default:
      if (type === gl.FLOAT && size > 1) {
        gl.uniform1fv(location, ensureTypedArray(value, Float32Array));
      } else if ((type === gl.INT || type === gl.BOOL) && size > 1) {
        gl.uniform1iv(location, ensureTypedArray(value, Int32Array));
      } else {
        console.warn(`Unsupported uniform type: ${type}`);
      }
      break;
    }
    }
    
    render(programName, uniforms = {}, attributes = {}) {
    const program = this.programs.get(programName);
    if (!program) {
    throw new Error(`Program "${programName}" not found`);
    }
    
    this.gl.useProgram(program);
    
    // Already has the font-image
    const textureUnits = [];
    
    const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    
    for (const [name, value] of Object.entries(uniforms)) {
    this.setUniform(this.gl, textureUnits, numUniforms, uniforms, program, name, value);
    }
    
    for (const [name, value] of Object.entries(attributes)) {
    const location = this.gl.getAttribLocation(program, name);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, value.buffer);
    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, value.size, this.gl.FLOAT, false, 0, 0);
    }
    
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    createFullscreenQuad() {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
    this.gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    this.gl.STATIC_DRAW
    );
    return {buffer, size: 2};
    }
    
    createPipeline() {
    // Create fullscreen quad
    const fullscreenQuad = this.createFullscreenQuad();
    
    return new Pipeline(this, fullscreenQuad);
    }
}
