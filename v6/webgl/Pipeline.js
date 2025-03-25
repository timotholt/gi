import { Pass } from './Pass.js';

export class Pipeline {
    constructor(w, quad) {
    this.w = w;
    this.quad = quad;
    this.passes = {};
    }
    
    createPass(materialProperties) {
    const {name} = materialProperties;
    const passName = `pass-${Object.keys(this.passes).length}:-${name ?? ""}`;
    const pass = new Pass(
    this.w,
    this.quad,
    {
      ...materialProperties,
      name: passName,
    },
    );
    this.passes[passName] = pass;
    return pass;
    }
}
