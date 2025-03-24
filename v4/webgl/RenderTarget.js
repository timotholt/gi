export class RenderTarget {
    constructor(gl, name, texture, framebuffer) {
    this.gl = gl;
    this.name = name;
    this.texture = texture;
    this.framebuffer = framebuffer;
    }
    
    updateFilters({ minFilter, magFilter }) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
}
