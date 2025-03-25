export const isMobile = (() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    })();
    
    if (isMobile) {
    const inp = document.createElement("input");
    const inpCon = document.querySelector("#mobile-input");
    inpCon.appendChild(inp);
}
