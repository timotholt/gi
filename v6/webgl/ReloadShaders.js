// @run
function onBuildReload(self, instance) {
    return (event) => {
    const oldShaderSet = new Set(
    Object.keys(window[instance])
    .filter((a) => a.toLowerCase().includes("stage"))
    .map((p) => window[instance][p]?.fragmentShader)
    );
    document.querySelectorAll("iframe").forEach((o) => {
    o.parentNode.removeChild(o);
    });
    const iframe = document.createElement('iframe');
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const htmlContent = event.html;
    iframe.srcdoc = htmlContent;
    
    iframe.onload = () => {
    const win = iframe.contentWindow[instance];
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    const shaders = Object.keys(win)
      .filter((a) => a.toLowerCase().includes("stage"))
      .map((p) => win?.[p]?.fragmentShader);
    
    if (oldShaderSet.size === shaders.length) {
      const same = shaders.filter((shader) => oldShaderSet.has(shader));
      if (same.length === shaders.length) {
        window.location.reload();
        return;
      }
    }
    
    Object.keys(win)
      .filter((a) => a.toLowerCase().includes("stage"))
      .forEach((p) => {
        const shader = win?.[p]?.fragmentShader;
        if (shader) {
          self[p].updateFragmentShader(shader);
        }
    });
    
    self.renderPass();
    document.querySelectorAll("iframe").forEach((o) => {
      o.parentNode.removeChild(o);
    });
    };
    return false;
    };
}
export { onBuildReload };