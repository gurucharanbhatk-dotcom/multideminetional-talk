// MultiDimensionalTalks — 3D brass seal emblem (hero signature element)
// Renders a slowly rotating coin/seal made from a canvas-drawn emblem
// texture, with an orbiting brass ring, using three.js.

(function(){
  const mount = document.getElementById('seal-canvas');
  if (!mount || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  const renderer = new THREE.WebGLRenderer({ canvas: mount, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function size(){
    const box = mount.parentElement.getBoundingClientRect();
    const s = Math.min(box.width, box.height) || 480;
    renderer.setSize(s, s, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  size();
  window.addEventListener('resize', size);

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0x8899aa, 0.55));
  const key = new THREE.DirectionalLight(0xffe6bd, 2.1);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7ea0c9, 1.1);
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xbe9a63, 0.6, 20);
  fill.position.set(-3, 2, 4);
  scene.add(fill);

  // ---- canvas texture: the seal face ----
  function drawSealTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const ctx = c.getContext('2d');
    const cx = 512, cy = 512;

    // base
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(0,0,1024,1024);

    const grad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 500);
    grad.addColorStop(0, '#e7c98d');
    grad.addColorStop(0.55, '#b98f52');
    grad.addColorStop(1, '#7a5a30');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 500, 0, Math.PI*2); ctx.fill();

    // concentric rings
    ctx.strokeStyle = 'rgba(10,20,32,0.55)';
    [468, 452, 360, 344].forEach((r, i) => {
      ctx.lineWidth = i % 2 === 0 ? 6 : 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    });

    // circular text
    function circularText(text, radius, startAngle, size, spacing){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.font = `${size}px 'IBM Plex Mono', monospace`;
      ctx.fillStyle = '#0a1420';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      let angle = startAngle;
      for (const ch of text){
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -radius);
        ctx.rotate(Math.PI/2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        angle += spacing;
      }
      ctx.restore();
    }
    circularText('  MULTIDIMENSIONALTALKS  •  MULTIDIMENSIONALTALKS  •  ', 406, -Math.PI/2, 27, 0.0975);

    // center monogram MDT
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#0a1420';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "600 250px 'Fraunces', Georgia, serif";
    ctx.fillText('MD', 0, -18);
    ctx.font = "500 15px 'IBM Plex Mono', monospace";
    ctx.fillText('· T A L K S ·', 0, 150);
    ctx.restore();

    // small laurel-ish ticks
    ctx.strokeStyle = 'rgba(10,20,32,0.6)';
    ctx.lineWidth = 3;
    for (let i=0;i<72;i++){
      const a = (i/72) * Math.PI * 2;
      const r1 = 330, r2 = 316;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*r1, cy + Math.sin(a)*r1);
      ctx.lineTo(cx + Math.cos(a)*r2, cy + Math.sin(a)*r2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }

  const faceTex = drawSealTexture();

  // ---- coin geometry ----
  const coin = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb2884f, metalness: 0.75, roughness: 0.32 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.55, roughness: 0.38 });

  const geo = new THREE.CylinderGeometry(2.6, 2.6, 0.34, 96, 1, false);
  const materials = [bodyMat, faceMat, faceMat];
  const mesh = new THREE.Mesh(geo, materials);
  mesh.rotation.x = Math.PI / 2 * 0; // keep face toward camera via group rotation instead
  mesh.rotation.z = Math.PI / 2 * 0;
  mesh.rotation.x = Math.PI / 2 - Math.PI/2; // no-op, orientation fixed below
  mesh.geometry.rotateX(Math.PI/2); // orient cylinder axis toward camera (z)
  coin.add(mesh);

  // orbiting ring
  const ringGeo = new THREE.TorusGeometry(3.35, 0.02, 16, 128);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xe1c387, metalness: 0.9, roughness: 0.25, emissive: 0x3a2a12, emissiveIntensity: 0.2 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.4;
  ring.rotation.y = 0.3;
  coin.add(ring);

  const ring2 = ring.clone();
  ring2.geometry = new THREE.TorusGeometry(3.7, 0.012, 16, 128);
  ring2.rotation.x = -Math.PI / 3.1;
  ring2.rotation.y = -0.5;
  ring2.material = ringMat.clone();
  ring2.material.opacity = 0.6;
  ring2.material.transparent = true;
  coin.add(ring2);

  scene.add(coin);

  // gentle particle dust
  const dustGeo = new THREE.BufferGeometry();
  const N = 120;
  const positions = new Float32Array(N * 3);
  for (let i=0;i<N;i++){
    const r = 5.5 + Math.random()*3.5;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos((Math.random()*2)-1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i*3+2] = r * Math.cos(phi);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xd8b77e, size: 0.028, transparent: true, opacity: 0.55 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // pointer parallax
  let targetRotY = 0, targetRotX = 0;
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth) - 0.5;
    const ny = (e.clientY / window.innerHeight) - 0.5;
    targetRotY = nx * 0.5;
    targetRotX = ny * 0.25;
  });

  let t = 0;
  function animate(){
    requestAnimationFrame(animate);
    t += reduceMotion ? 0 : 0.006;
    coin.rotation.y += ((reduceMotion ? 0 : 0.012) + targetRotY*0.02) - coin.rotation.y*0.0 ;
    coin.rotation.y = coin.rotation.y; // (kept simple/stable)
    coin.rotation.x += (targetRotX*0.02 - coin.rotation.x) * 0.04;
    mesh.rotation.y = t * (reduceMotion ? 0 : 1);
    ring.rotation.z = t * 0.6;
    ring2.rotation.z = -t * 0.4;
    dust.rotation.y = t * 0.15;
    coin.position.y = Math.sin(t*0.9) * 0.12;
    renderer.render(scene, camera);
  }
  animate();
})();
