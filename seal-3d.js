// MultiDimensionalTalks — 3D brass seal emblem (hero signature element)
// Pure CSS-3D + JS (no WebGL, no external library). This renders reliably
// on every device, including phones and older browsers, since it only needs
// the `perspective` / `transform-style: preserve-3d` CSS features rather
// than a WebGL context.

(function () {
  const coin = document.getElementById('seal-3d');
  if (!coin) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let angle = 0;
  let tiltX = 0, tiltY = 0;
  let targetTiltX = 0, targetTiltY = 0;

  function onPointer(x, y) {
    const nx = (x / window.innerWidth) - 0.5;
    const ny = (y / window.innerHeight) - 0.5;
    targetTiltY = nx * 14;   // left/right look
    targetTiltX = -ny * 10;  // up/down look
  }
  window.addEventListener('pointermove', (e) => onPointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function frame() {
    requestAnimationFrame(frame);
    if (!reduceMotion) angle += 0.35;
    tiltX += (targetTiltX - tiltX) * 0.05;
    tiltY += (targetTiltY - tiltY) * 0.05;
    coin.style.transform = `rotateX(${tiltX}deg) rotateY(${angle + tiltY}deg)`;
  }
  frame();
})();
