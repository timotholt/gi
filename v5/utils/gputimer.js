// @run

export class GPUTimer {
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
