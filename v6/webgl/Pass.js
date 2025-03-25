const prefix = `#version 300 es
precision highp float;
precision highp int;
`;

// Vertex Shader (shared by both passes)
const vertexShaderDefault = `${prefix}
in vec2 position;
out vec2 vUv;
void main() {
vUv = 0.5 * (position + 1.0);
gl_Position = vec4(position, 0.0, 1.0);
}`;

export class Pass {
    constructor(w, quad, materialProperties) {
    const {fragmentShader, vertexShader, uniforms, name} = materialProperties;
    this.vertexShader = vertexShader ?? vertexShaderDefault;
    this.fragmentShader = fragmentShader;
    this.program = w.createProgram(
    this.vertexShader,
    `${prefix}${this.fragmentShader}`
    );
    this.uniforms = uniforms;
    this.quad = quad;
    this.name = name;
    w.programs.set(name, this.program);
    this.w = w;
    }
    
    updateFragmentShader(fragmentShader) {
    this.fragmentShader = fragmentShader;
    this.program = this.w.createProgram(
    this.vertexShader,
    `${prefix}${this.fragmentShader}`
    );
    this.w.programs.set(this.name, this.program);
    }
    
    set(updates) {
    Object.keys(updates).forEach((key) => {
    this.uniforms[key] = updates[key];
    });
    }
    
    render(overrides = {}) {
    this.w.render(
    this.name,
    {
      ...this.uniforms,
      ...overrides
    },
    {position: this.quad},
    );
    }
}
