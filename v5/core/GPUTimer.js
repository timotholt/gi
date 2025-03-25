
// @run

class GPUTimer {
    constructor(gl, disabled = false) {
    this.gl = gl;
    this.ext = !disabled && this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (!this.ext) {
    console.warn('EXT_disjoint_timer_query_webgl2 not available');
    }
    this.queries = new Map();
    this.results = new Map();
    this.lastPrintTime = Date.now();
    this.printInterval = 1000; // 10 seconds
    
    }
    
    start(id) {
    if (!this.ext) return;
    const query = this.gl.createQuery();
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query);
    if (!this.queries.has(id)) {
    this.queries.set(id, []);
    }
    this.queries.get(id).push(query);
    }
    
    end(id) {
    if (!this.ext) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    }
    
    update() {
    if (!this.ext) return;
    for (const [id, queryList] of this.queries) {
    const completedQueries = [];
    for (let i = queryList.length - 1; i >= 0; i--) {
      const query = queryList[i];
      const available = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE);
      const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    
      if (available && !disjoint) {
        const timeElapsed = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT);
        const timeMs = timeElapsed / 1000000; // Convert nanoseconds to milliseconds
    
        if (!this.results.has(id)) {
          this.results.set(id, []);
        }
        this.results.get(id).push(timeMs);
    
        completedQueries.push(query);
        queryList.splice(i, 1);
      }
    }
    
    // Clean up completed queries
    completedQueries.forEach(query => this.gl.deleteQuery(query));
    }
    
    // Check if it's time to print results
    const now = Date.now();
    if (now - this.lastPrintTime > this.printInterval) {
    this.printAverages();
    this.lastPrintTime = now;
    }
    }
    
    printAverages() {
    if (!this.ext) return;
    console.log('--- GPU Timing Averages ---');
    for (const [id, times] of this.results) {
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`${id}: ${avg.toFixed(2)}ms (${times.length} samples)`);
    }
    }
    console.log('---------------------------');
    }
    }
    
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
    
    